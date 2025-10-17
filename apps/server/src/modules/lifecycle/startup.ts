import { and, eq, or } from "drizzle-orm";
import { getTasks, schedule } from "node-cron";
import { db } from "../../db/db";
import { volumesTable } from "../../db/schema";
import { logger } from "../../utils/logger";
import { restic } from "../../utils/restic";
import { volumeService } from "../volumes/volume.service";
import { cleanupDanglingMounts } from "./cleanup";

export const startup = async () => {
	await restic.ensurePassfile();
	cleanupDanglingMounts();

	const volumes = await db.query.volumesTable.findMany({
		where: or(
			eq(volumesTable.status, "mounted"),
			and(eq(volumesTable.autoRemount, true), eq(volumesTable.status, "error")),
		),
	});

	for (const volume of volumes) {
		await volumeService.mountVolume(volume.name);
	}

	const existingTasks = getTasks();
	existingTasks.forEach(async (task) => await task.destroy());

	schedule("0 * * * *", async () => {
		logger.debug("Running hourly cleanup of dangling mounts...");
		await cleanupDanglingMounts();
	});

	schedule("* * * * *", async () => {
		logger.debug("Running health check for all volumes...");

		const volumes = await db.query.volumesTable.findMany({
			where: or(eq(volumesTable.status, "mounted"), eq(volumesTable.status, "error")),
		});

		for (const volume of volumes) {
			const { status } = await volumeService.checkHealth(volume.name);
			if (status === "error" && volume.autoRemount) {
				await volumeService.mountVolume(volume.name);
			}
		}
	});
};
