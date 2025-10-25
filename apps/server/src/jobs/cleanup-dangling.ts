import { Job } from "../core/scheduler";
import path from "node:path";
import fs from "node:fs/promises";
import { volumeService } from "../modules/volumes/volume.service";
import { readMountInfo } from "../utils/mountinfo";
import { getVolumePath } from "../modules/volumes/helpers";
import { logger } from "../utils/logger";
import { executeUnmount } from "../modules/backends/utils/backend-utils";
import { toMessage } from "../utils/errors";
import { VOLUME_MOUNT_BASE } from "../core/constants";

export class CleanupDanglingMountsJob extends Job {
	async run() {
		const allVolumes = await volumeService.listVolumes();
		const allSystemMounts = await readMountInfo();

		for (const mount of allSystemMounts) {
			if (mount.mountPoint.includes("ironmount") && mount.mountPoint.endsWith("_data")) {
				const matchingVolume = allVolumes.find((v) => getVolumePath(v.name) === mount.mountPoint);
				if (!matchingVolume) {
					logger.info(`Found dangling mount at ${mount.mountPoint}, attempting to unmount...`);
					await executeUnmount(mount.mountPoint);

					await fs.rmdir(path.dirname(mount.mountPoint)).catch((err) => {
						logger.warn(
							`Failed to remove dangling mount directory ${path.dirname(mount.mountPoint)}: ${toMessage(err)}`,
						);
					});
				}
			}
		}

		const allIronmountDirs = await fs.readdir(VOLUME_MOUNT_BASE).catch(() => []);

		for (const dir of allIronmountDirs) {
			const volumePath = getVolumePath(dir);
			const matchingVolume = allVolumes.find((v) => getVolumePath(v.name) === volumePath);
			if (!matchingVolume) {
				const fullPath = path.join(VOLUME_MOUNT_BASE, dir);
				logger.info(`Found dangling mount directory at ${fullPath}, attempting to remove...`);
				await fs.rmdir(fullPath, { recursive: true }).catch((err) => {
					logger.warn(`Failed to remove dangling mount directory ${fullPath}: ${toMessage(err)}`);
				});
			}
		}

		return { done: true, timestamp: new Date() };
	}
}
