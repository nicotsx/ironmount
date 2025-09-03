import * as fs from "node:fs/promises";
import * as npath from "node:path";
import { BACKEND_STATUS, type BackendConfig } from "@ironmount/schemas";
import type { VolumeBackend } from "../backend";

const mount = async (_config: BackendConfig, path: string) => {
	console.log("Mounting directory volume...");
	await fs.mkdir(path, { recursive: true });
};

const unmount = async () => {
	console.log("Cannot unmount directory volume.");
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
		console.error("Directory health check failed:", error);
		return { status: BACKEND_STATUS.error, error: error instanceof Error ? error.message : String(error) };
	}
};

export const makeDirectoryBackend = (config: BackendConfig, path: string): VolumeBackend => ({
	mount: () => mount(config, path),
	unmount,
	checkHealth: () => checkHealth(path),
});
