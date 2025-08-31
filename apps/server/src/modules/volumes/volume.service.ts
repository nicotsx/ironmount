import * as path from "node:path";
import { eq } from "drizzle-orm";
import { ConflictError } from "http-errors-enhanced";
import slugify from "slugify";
import { config } from "../../core/config";
import { db } from "../../db/db";
import { type BackendConfig, volumesTable } from "../../db/schema";

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

export const volumeService = {
	listVolumes,
	createVolume,
};
