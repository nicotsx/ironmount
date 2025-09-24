import { and, eq, or } from "drizzle-orm";
import { db } from "../../db/db";
import { logger } from "../../utils/logger";
import { volumesTable } from "../../db/schema";
import { schedule, getTasks } from "node-cron";
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
	existingTasks.forEach((task) => task.destroy());

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
