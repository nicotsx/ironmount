import fs from "node:fs/promises";
import path from "node:path";
import { VOLUME_MOUNT_BASE } from "../../core/constants";
import { toMessage } from "../../utils/errors";
import { logger } from "../../utils/logger";
import { readMountInfo } from "../../utils/mountinfo";
import { executeUnmount } from "../backends/utils/backend-utils";
import { getVolumePath } from "../volumes/helpers";
import { volumeService } from "../volumes/volume.service";

export const cleanupDanglingMounts = async () => {
	const allVolumes = await volumeService.listVolumes();
	const allSystemMounts = await readMountInfo();

	for (const mount of allSystemMounts) {
		if (mount.mountPoint.includes("ironmount") && mount.mountPoint.endsWith("_data")) {
			const matchingVolume = allVolumes.find((v) => getVolumePath(v.name) === mount.mountPoint);
			if (!matchingVolume) {
				logger.info(`Found dangling mount at ${mount.mountPoint}, attempting to unmount...`);
				await executeUnmount(mount.mountPoint);

				await fs.rmdir(path.dirname(mount.mountPoint)).catch((err) => {
					logger.warn(`Failed to remove dangling mount directory ${path.dirname(mount.mountPoint)}: ${toMessage(err)}`);
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
};
