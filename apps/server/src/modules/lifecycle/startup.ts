import { and, eq, or } from "drizzle-orm";
import { getTasks, schedule } from "node-cron";
import { db } from "../../db/db";
import { volumesTable } from "../../db/schema";
import { logger } from "../../utils/logger";
import { volumeService } from "../volumes/volume.service";
import { restic } from "../../utils/restic";

export const startup = async () => {
	await restic.ensurePassfile();

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
