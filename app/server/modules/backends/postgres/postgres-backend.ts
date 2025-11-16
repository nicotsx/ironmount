import * as fs from "node:fs/promises";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { testPostgresConnection } from "../../../utils/database-dump";
import type { VolumeBackend } from "../backend";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";

const mount = async (config: BackendConfig, volumePath: string) => {
	if (config.backend !== "postgres") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	logger.info(`Testing PostgreSQL connection to: ${config.host}:${config.port}`);

	try {
		await testPostgresConnection(config);
		await fs.mkdir(volumePath, { recursive: true });

		logger.info("PostgreSQL connection successful");
		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("Failed to connect to PostgreSQL:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

const unmount = async (volumePath: string) => {
	logger.info("Cleaning up PostgreSQL dump directory");
	
	try {
		await fs.rm(volumePath, { recursive: true, force: true });
		return { status: BACKEND_STATUS.unmounted };
	} catch (error) {
		logger.warn(`Failed to clean up PostgreSQL dump directory: ${toMessage(error)}`);
		return { status: BACKEND_STATUS.unmounted };
	}
};

const checkHealth = async (config: BackendConfig) => {
	if (config.backend !== "postgres") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	try {
		await testPostgresConnection(config);
		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("PostgreSQL health check failed:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

export const makePostgresBackend = (config: BackendConfig, volumePath: string): VolumeBackend => ({
	mount: () => mount(config, volumePath),
	unmount: () => unmount(volumePath),
	checkHealth: () => checkHealth(config),
});