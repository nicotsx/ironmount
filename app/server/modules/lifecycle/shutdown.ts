import { Scheduler } from "../../core/scheduler";
import { eq, or } from "drizzle-orm";
import { db } from "../../db/db";
import { volumesTable } from "../../db/schema";
import { logger } from "../../utils/logger";
import { SOCKET_PATH } from "../../core/constants";
import { createVolumeBackend } from "../backends/backend";

export const shutdown = async () => {
	await Scheduler.stop();

	await Bun.file(SOCKET_PATH)
		.delete()
		.catch(() => {
			// Ignore errors if the socket file does not exist
		});

	const volumes = await db.query.volumesTable.findMany({
		where: or(eq(volumesTable.status, "mounted")),
	});

	for (const volume of volumes) {
		const backend = createVolumeBackend(volume);
		const { status, error } = await backend.unmount();

		logger.info(`Volume ${volume.name} unmount status: ${status}${error ? `, error: ${error}` : ""}`);
	}
};
