import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { logger } from "../../utils/logger";
import { volumesTable } from "../../db/schema";
import { createVolumeBackend } from "../backends/backend";

export const startup = async () => {
	logger.info("Mounting all volumes...");

	const volumes = await db.query.volumesTable.findMany({ where: eq(volumesTable.status, "mounted") });

	for (const volume of volumes) {
		try {
			const backend = createVolumeBackend(volume);
			await backend.mount();
			logger.info(`Mounted volume ${volume.name} successfully`);
		} catch (error) {
			logger.error(`Failed to mount volume ${volume.name}:`, error);
			await db.update(volumesTable).set({ status: "unmounted" }).where(eq(volumesTable.name, volume.name));
		}
	}
};
