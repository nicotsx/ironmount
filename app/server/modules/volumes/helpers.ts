import { VOLUME_MOUNT_BASE } from "../../core/constants";
import type { Volume } from "../../db/schema";
import type { BackendConfig } from "~/schemas/volumes";

export const getVolumePath = (volume: Volume) => {
	if (volume.config.backend === "directory") {
		return volume.config.path;
	}

	return `${VOLUME_MOUNT_BASE}/${volume.name}/_data`;
};

/**
 * Check if a volume is a database volume
 */
export const isDatabaseVolume = (volume: Volume): boolean => {
	return ["mariadb", "mysql", "postgres", "sqlite"].includes(volume.config.backend);
};

/**
 * Check if a backend config is a database backend
 */
export const isDatabaseBackend = (config: BackendConfig): boolean => {
	return ["mariadb", "mysql", "postgres", "sqlite"].includes(config.backend);
};

/**
 * Get the dump directory path for a database volume
 */
export const getDumpPath = (volume: Volume): string => {
	return `${VOLUME_MOUNT_BASE}/${volume.name}/dumps`;
};

/**
 * Get the dump file path for a database volume backup
 */
export const getDumpFilePath = (volume: Volume, timestamp: number): string => {
	const dumpDir = getDumpPath(volume);
	const extension = volume.config.backend === "postgres" &&
		volume.config.backend === "postgres" &&
		(volume.config as Extract<BackendConfig, { backend: "postgres" }>).dumpFormat !== "plain"
		? "dump"
		: "sql";
	return `${dumpDir}/${volume.name}-${timestamp}.${extension}`;
};
