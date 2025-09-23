import { eq, or } from "drizzle-orm";
import { db } from "../../db/db";
import { logger } from "../../utils/logger";
import { volumesTable } from "../../db/schema";
import { createVolumeBackend } from "../backends/backend";
import { schedule, getTasks } from "node-cron";

export const startup = async () => {
	const volumes = await db.query.volumesTable.findMany({
		where: or(eq(volumesTable.status, "mounted"), eq(volumesTable.autoRemount, 1)),
	});

	for (const volume of volumes) {
		try {
			const backend = createVolumeBackend(volume);
			await backend.mount();
			await db
				.update(volumesTable)
				.set({ status: "mounted", lastHealthCheck: new Date(), lastError: null })
				.where(eq(volumesTable.name, volume.name));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to mount volume ${volume.name}:`, errorMessage);

			await db
				.update(volumesTable)
				.set({ status: "error", lastError: errorMessage })
				.where(eq(volumesTable.name, volume.name));
		}
	}

	// const tasks = getTasks();
	// logger.info("Existing scheduled tasks:", tasks);
	// tasks.forEach((task) => task.destroy());
	//
	// schedule("* * * * *", async () => {
	// 	logger.info("Running health check for all volumes...");
	//
	// 	const volumes = await db.query.volumesTable.findMany({
	// 		where: or(eq(volumesTable.status, "mounted")),
	// 	});
	//
	// 	for (const volume of volumes) {
	// 		try {
	// 			const backend = createVolumeBackend(volume);
	// 			const health = await backend.checkHealth();
	//
	// 			if (health.status !== volume.status || health.error) {
	// 				await db
	// 					.update(volumesTable)
	// 					.set({ status: health.status, lastError: health.error, lastHealthCheck: new Date() })
	// 					.where(eq(volumesTable.name, volume.name));
	//
	// 				logger.info(`Volume ${volume.name} status updated to ${health.status}`);
	// 			}
	// 		} catch (error) {
	// 			logger.error(`Health check failed for volume ${volume.name}:`, error);
	// 			await db
	// 				.update(volumesTable)
	// 				.set({ status: "unmounted", lastError: (error as Error).message, lastHealthCheck: new Date() })
	// 				.where(eq(volumesTable.name, volume.name));
	// 		}
	// 	}
	// });
};
