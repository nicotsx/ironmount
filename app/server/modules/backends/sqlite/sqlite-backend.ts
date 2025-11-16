import * as fs from "node:fs/promises";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { testSQLiteConnection } from "../../../utils/database-dump";
import type { VolumeBackend } from "../backend";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";

const mount = async (config: BackendConfig, volumePath: string) => {
	if (config.backend !== "sqlite") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	logger.info(`Testing SQLite connection to: ${config.path}`);

	try {
		await testSQLiteConnection(config);
		await fs.mkdir(volumePath, { recursive: true });

		logger.info("SQLite connection successful");
		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("Failed to access SQLite database:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

const unmount = async (volumePath: string) => {
	logger.info("Cleaning up SQLite dump directory");
	
	try {
		await fs.rm(volumePath, { recursive: true, force: true });
		return { status: BACKEND_STATUS.unmounted };
	} catch (error) {
		logger.warn(`Failed to clean up SQLite dump directory: ${toMessage(error)}`);
		return { status: BACKEND_STATUS.unmounted };
	}
};

const checkHealth = async (config: BackendConfig) => {
	if (config.backend !== "sqlite") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	try {
		await testSQLiteConnection(config);
		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("SQLite health check failed:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

export const makeSQLiteBackend = (config: BackendConfig, volumePath: string): VolumeBackend => ({
	mount: () => mount(config, volumePath),
	unmount: () => unmount(volumePath),
	checkHealth: () => checkHealth(config),
});