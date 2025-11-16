import * as fs from "node:fs/promises";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { testMySQLConnection } from "../../../utils/database-dump";
import type { VolumeBackend } from "../backend";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";

const mount = async (config: BackendConfig, volumePath: string) => {
	if (config.backend !== "mysql") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	logger.info(`Testing MySQL connection to: ${config.host}:${config.port}`);

	try {
		await testMySQLConnection(config);
		await fs.mkdir(volumePath, { recursive: true });

		logger.info("MySQL connection successful");
		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("Failed to connect to MySQL:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

const unmount = async (volumePath: string) => {
	logger.info("Cleaning up MySQL dump directory");
	
	try {
		await fs.rm(volumePath, { recursive: true, force: true });
		return { status: BACKEND_STATUS.unmounted };
	} catch (error) {
		logger.warn(`Failed to clean up MySQL dump directory: ${toMessage(error)}`);
		return { status: BACKEND_STATUS.unmounted };
	}
};

const checkHealth = async (config: BackendConfig) => {
	if (config.backend !== "mysql") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	try {
		await testMySQLConnection(config);
		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("MySQL health check failed:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

export const makeMySQLBackend = (config: BackendConfig, volumePath: string): VolumeBackend => ({
	mount: () => mount(config, volumePath),
	unmount: () => unmount(volumePath),
	checkHealth: () => checkHealth(config),
});