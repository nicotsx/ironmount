import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { BackendConfig } from "@ironmount/schemas";
import { eq } from "drizzle-orm";
import { ConflictError, InternalServerError, NotFoundError } from "http-errors-enhanced";
import slugify from "slugify";
import { config } from "../../core/config";
import { db } from "../../db/db";
import { volumesTable } from "../../db/schema";
import { createVolumeBackend } from "../backends/backend";
import { toMessage } from "../../utils/errors";
import { getStatFs, type StatFs } from "../../utils/mountinfo";
import { VOLUME_MOUNT_BASE } from "../../core/constants";

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

	const volumePathHost = path.join(config.volumeRootHost);

	const val = await db
		.insert(volumesTable)
		.values({
			name: slug,
			config: backendConfig,
			path: path.join(volumePathHost, slug),
			type: backendConfig.backend,
		})
		.returning();

	return { volume: val[0], status: 201 };
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
		.set({ status, lastError: error, lastHealthCheck: new Date() })
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
		statfs = (await getStatFs(`${VOLUME_MOUNT_BASE}/${name}/_data`).catch(() => {})) ?? {};
	}

	return { volume, statfs };
};

const updateVolume = async (name: string, backendConfig: BackendConfig) => {
	const existing = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!existing) {
		throw new NotFoundError("Volume not found");
	}

	const [updated] = await db
		.update(volumesTable)
		.set({
			config: backendConfig,
			type: backendConfig.backend,
			updatedAt: new Date(),
			status: "unmounted",
		})
		.where(eq(volumesTable.name, name))
		.returning();

	if (!updated) {
		throw new InternalServerError("Failed to update volume");
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
		autoRemount: 0 as const,
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
};
