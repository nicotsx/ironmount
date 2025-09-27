import { and, eq, or } from "drizzle-orm";
import { getTasks, schedule } from "node-cron";
import { db } from "../../db/db";
import { volumesTable } from "../../db/schema";
import { logger } from "../../utils/logger";
import { volumeService } from "../volumes/volume.service";

export const startup = async () => {
	const volumes = await db.query.volumesTable.findMany({
		where: or(
			eq(volumesTable.status, "mounted"),
			and(eq(volumesTable.autoRemount, 1), eq(volumesTable.status, "error")),
		),
	});

	for (const volume of volumes) {
		await volumeService.mountVolume(volume.name);
	}

	const existingTasks = getTasks();
	existingTasks.forEach(async (task) => await task.destroy());

	schedule("* * * * *", async () => {
		logger.info("Running health check for all volumes...");

		const volumes = await db.query.volumesTable.findMany({
			where: or(eq(volumesTable.status, "mounted"), eq(volumesTable.status, "error")),
		});

		for (const volume of volumes) {
			const { error } = await volumeService.checkHealth(volume.name);
			if (error && volume.autoRemount) {
				// TODO: retry with backoff based on last health check time
				// Until we reach the max backoff and it'll try every 10 minutes
				await volumeService.mountVolume(volume.name);
			}
		}
	});
};
