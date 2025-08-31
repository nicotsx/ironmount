import * as path from "node:path";
import { eq } from "drizzle-orm";
import { ConflictError, InternalServerError, NotFoundError } from "http-errors-enhanced";
import slugify from "slugify";
import { config } from "../../core/config";
import { db } from "../../db/db";
import { type BackendConfig, volumesTable } from "../../db/schema";
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
			type: "nfs",
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

export const volumeService = {
	listVolumes,
	createVolume,
	mountVolume,
	deleteVolume,
};
