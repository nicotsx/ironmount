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
		return { error: new ConflictError("Volume already exists") };
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
	try {
		const volume = await db.query.volumesTable.findFirst({
			where: eq(volumesTable.name, name),
		});

		if (!volume) {
			return { error: new NotFoundError("Volume not found") };
		}

		const backend = createVolumeBackend(volume);
		await backend.unmount();
		await db.delete(volumesTable).where(eq(volumesTable.name, name));
		return { status: 200 };
	} catch (error) {
		return {
			error: new InternalServerError("Failed to delete volume", {
				cause: error,
			}),
		};
	}
};

const mountVolume = async (name: string) => {
	try {
		const volume = await db.query.volumesTable.findFirst({
			where: eq(volumesTable.name, name),
		});

		if (!volume) {
			return { error: new NotFoundError("Volume not found") };
		}

		const backend = createVolumeBackend(volume);
		await backend.mount();
	} catch (error) {
		return {
			error: new InternalServerError("Failed to mount volume", {
				cause: error,
			}),
		};
	}
};

const getVolume = async (name: string) => {
	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.name, name),
	});

	if (!volume) {
		return { error: new NotFoundError("Volume not found") };
	}

	return { volume };
};

const updateVolume = async (name: string, backendConfig: BackendConfig) => {
	try {
		const existing = await db.query.volumesTable.findFirst({
			where: eq(volumesTable.name, name),
		});

		if (!existing) {
			return { error: new NotFoundError("Volume not found") };
		}

		const oldBackend = createVolumeBackend(existing);
		await oldBackend.unmount();

		const updated = await db
			.update(volumesTable)
			.set({
				config: backendConfig,
				type: backendConfig.backend,
				updatedAt: new Date(),
			})
			.where(eq(volumesTable.name, name))
			.returning();

		// Mount with new configuration
		const newBackend = createVolumeBackend(updated[0]);
		await newBackend.mount();

		return { volume: updated[0] };
	} catch (error) {
		return {
			error: new InternalServerError("Failed to update volume", {
				cause: error,
			}),
		};
	}
};

const testConnection = async (backendConfig: BackendConfig) => {
	let tempDir: string | null = null;

	try {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ironmount-test-"));

		const mockVolume = {
			id: 0,
			name: "test-connection",
			path: tempDir,
			config: backendConfig,
			createdAt: new Date(),
			updatedAt: new Date(),
			type: backendConfig.backend,
		};

		const backend = createVolumeBackend(mockVolume);

		await backend.mount();
		await backend.unmount();

		return {
			success: true,
			message: "Connection successful",
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Connection failed",
		};
	} finally {
		if (tempDir) {
			try {
				await fs.access(tempDir);
				await fs.rm(tempDir, { recursive: true, force: true });
			} catch (cleanupError) {
				// Ignore cleanup errors if directory doesn't exist or can't be removed
				console.warn("Failed to cleanup temp directory:", cleanupError);
			}
		}
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
};
