import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { BackendConfig } from "@ironmount/schemas";
import Docker from "dockerode";
import { eq } from "drizzle-orm";
import { ConflictError, InternalServerError, NotFoundError } from "http-errors-enhanced";
import slugify from "slugify";
import { VOLUME_MOUNT_BASE } from "../../core/constants";
import { db } from "../../db/db";
import { volumesTable } from "../../db/schema";
import { toMessage } from "../../utils/errors";
import { getStatFs, type StatFs } from "../../utils/mountinfo";
import { createVolumeBackend } from "../backends/backend";
import type { UpdateVolumeBody } from "./volume.dto";

const listVolumes = async () => {
	const volumes = await db.query.volumesTable.findMany({});

	return volumes;
};

const createVolume = async (name: string, backendConfig: BackendConfig) => {
	const slug = slugify(name, { lower: true, strict: true });

	const existing = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, slug),
	});

	if (existing) {
		throw new ConflictError("Volume already exists");
	}

	const volumePathHost = path.join(VOLUME_MOUNT_BASE);

	const [created] = await db
		.insert(volumesTable)
		.values({
			name: slug,
			config: backendConfig,
			path: path.join(volumePathHost, slug, "_data"),
			type: backendConfig.backend,
		})
		.returning();

	if (!created) {
		throw new InternalServerError("Failed to create volume");
	}

	const backend = createVolumeBackend(created);
	const { error, status } = await backend.mount();

	await db
		.update(volumesTable)
		.set({ status, lastError: error ?? null, lastHealthCheck: new Date() })
		.where(eq(volumesTable.name, slug));

	return { volume: created, status: 201 };
};

const deleteVolume = async (name: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	const backend = createVolumeBackend(volume);
	await backend.unmount();
	await db.delete(volumesTable).where(eq(volumesTable.name, name));
};

const mountVolume = async (name: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	const backend = createVolumeBackend(volume);
	const { error, status } = await backend.mount();

	await db
		.update(volumesTable)
		.set({ status, lastError: error ?? null, lastHealthCheck: new Date() })
		.where(eq(volumesTable.name, name));

	return { error, status };
};

const unmountVolume = async (name: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	const backend = createVolumeBackend(volume);
	const { status, error } = await backend.unmount();

	await db.update(volumesTable).set({ status }).where(eq(volumesTable.name, name));

	return { error, status };
};

const getVolume = async (name: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	let statfs: Partial<StatFs> = {};
	if (volume.status === "mounted") {
		statfs = await getStatFs(`${VOLUME_MOUNT_BASE}/${name}/_data`).catch(() => ({}));
	}

	return { volume, statfs };
};

const updateVolume = async (name: string, volumeData: UpdateVolumeBody) => {
	const existing = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!existing) {
		throw new NotFoundError("Volume not found");
	}

	const configChanged =
		JSON.stringify(existing.config) !== JSON.stringify(volumeData.config) && volumeData.config !== undefined;

	if (configChanged) {
		console.log("Unmounting existing volume before applying new config");
		const backend = createVolumeBackend(existing);
		await backend.unmount();
	}

	const [updated] = await db
		.update(volumesTable)
		.set({
			config: volumeData.config,
			type: volumeData.config?.backend,
			autoRemount: volumeData.autoRemount,
			updatedAt: new Date(),
		})
		.where(eq(volumesTable.name, name))
		.returning();

	if (!updated) {
		throw new InternalServerError("Failed to update volume");
	}

	if (configChanged) {
		const backend = createVolumeBackend(updated);
		const { error, status } = await backend.mount();
		await db
			.update(volumesTable)
			.set({ status, lastError: error ?? null, lastHealthCheck: new Date() })
			.where(eq(volumesTable.name, name));
	}

	return { volume: updated };
};

const testConnection = async (backendConfig: BackendConfig) => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ironmount-test-"));

	const mockVolume = {
		id: 0,
		name: "test-connection",
		path: tempDir,
		config: backendConfig,
		createdAt: new Date(),
		updatedAt: new Date(),
		lastHealthCheck: new Date(),
		type: backendConfig.backend,
		status: "unmounted" as const,
		lastError: null,
		autoRemount: true,
	};

	const backend = createVolumeBackend(mockVolume);
	const { error } = await backend.mount();

	await backend.unmount();

	await fs.access(tempDir);
	await fs.rm(tempDir, { recursive: true, force: true });

	return {
		success: !error,
		message: error ? toMessage(error) : "Connection successful",
	};
};

const checkHealth = async (name: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	const backend = createVolumeBackend(volume);
	const { error, status } = await backend.checkHealth();

	await db
		.update(volumesTable)
		.set({ lastHealthCheck: new Date(), status, lastError: error ?? null })
		.where(eq(volumesTable.name, volume.name));

	return { status, error };
};

const getContainersUsingVolume = async (name: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	const docker = new Docker();
	const containers = await docker.listContainers({ all: true });

	const usingContainers = [];
	for (const info of containers) {
		const container = docker.getContainer(info.Id);
		const inspect = await container.inspect();
		const mounts = inspect.Mounts || [];
		const usesVolume = mounts.some((mount) => mount.Type === "volume" && mount.Name === `im-${volume.name}`);
		if (usesVolume) {
			usingContainers.push({
				id: inspect.Id,
				name: inspect.Name,
				state: inspect.State.Status,
				image: inspect.Config.Image,
			});
		}
	}

	return { containers: usingContainers };
};

const listFiles = async (name: string, subPath?: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	if (volume.status !== "mounted") {
		throw new InternalServerError("Volume is not mounted");
	}

	const requestedPath = subPath ? path.join(volume.path, subPath) : volume.path;

	const normalizedPath = path.normalize(requestedPath);
	if (!normalizedPath.startsWith(volume.path)) {
		throw new InternalServerError("Invalid path");
	}

	try {
		const entries = await fs.readdir(normalizedPath, { withFileTypes: true });

		const files = await Promise.all(
			entries.map(async (entry) => {
				const fullPath = path.join(normalizedPath, entry.name);
				const relativePath = path.relative(volume.path, fullPath);

				try {
					const stats = await fs.stat(fullPath);
					return {
						name: entry.name,
						path: `/${relativePath}`,
						type: entry.isDirectory() ? ("directory" as const) : ("file" as const),
						size: entry.isFile() ? stats.size : undefined,
						modifiedAt: stats.mtimeMs,
					};
				} catch {
					return {
						name: entry.name,
						path: `/${relativePath}`,
						type: entry.isDirectory() ? ("directory" as const) : ("file" as const),
						size: undefined,
						modifiedAt: undefined,
					};
				}
			}),
		);

		return {
			files: files.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === "directory" ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			}),
			path: subPath || "/",
		};
	} catch (error) {
		throw new InternalServerError(`Failed to list files: ${toMessage(error)}`);
	}
};

export const volumeService = {
	listVolumes,
	createVolume,
	mountVolume,
	deleteVolume,
	getVolume,
	updateVolume,
	testConnection,
	unmountVolume,
	checkHealth,
	getContainersUsingVolume,
	listFiles,
};
