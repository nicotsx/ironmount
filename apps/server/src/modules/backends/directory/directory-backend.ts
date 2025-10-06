import * as fs from "node:fs/promises";
import * as npath from "node:path";
import { BACKEND_STATUS, type BackendConfig } from "@ironmount/schemas";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import type { VolumeBackend } from "../backend";

const mount = async (_config: BackendConfig, path: string) => {
	logger.info("Mounting directory volume...", path);
	await fs.mkdir(path, { recursive: true });
	return { status: BACKEND_STATUS.mounted };
};

const unmount = async () => {
	logger.info("Cannot unmount directory volume.");
	return { status: BACKEND_STATUS.unmounted };
};

const checkHealth = async (path: string) => {
	try {
		await fs.access(path);

		// Try to create a temporary file to ensure write access
		const tempFilePath = npath.join(path, `.healthcheck-${Date.now()}`);
		await fs.writeFile(tempFilePath, "healthcheck");
		await fs.unlink(tempFilePath);

		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("Directory health check failed:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

export const makeDirectoryBackend = (config: BackendConfig, path: string): VolumeBackend => ({
	mount: () => mount(config, path),
	unmount,
	checkHealth: () => checkHealth(path),
});
