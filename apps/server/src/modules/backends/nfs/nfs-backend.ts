import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as npath from "node:path";
import { BACKEND_STATUS, type BackendConfig } from "@ironmount/schemas";
import type { VolumeBackend } from "../backend";
import { logger } from "../../../utils/logger";

const mount = async (config: BackendConfig, path: string) => {
	if (config.backend !== "nfs") {
		throw new Error("Invalid backend config for NFS");
	}

	if (os.platform() !== "linux") {
		logger.error("NFS mounting is only supported on Linux hosts.");
		return;
	}

	await fs.mkdir(path, { recursive: true });

	const source = `${config.server}:${config.exportPath}`;
	const options = [`vers=${config.version}`, `port=${config.port}`];
	const cmd = `mount -t nfs -o ${options.join(",")} ${source} ${path}`;

	return new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("Mount command timed out"));
		}, 5000);

		exec(cmd, (error, stdout, stderr) => {
			logger.info("Mount command executed:", { cmd, error, stdout, stderr });
			clearTimeout(timeout);

			if (error) {
				logger.error(`Error mounting NFS volume: ${stderr}`);
				return reject(new Error(`Failed to mount NFS volume: ${stderr}`));
			}
			logger.info(`NFS volume mounted successfully: ${stdout}`);
			resolve();
		});
	});
};

const unmount = async (path: string) => {
	if (os.platform() !== "linux") {
		logger.error("NFS unmounting is only supported on Linux hosts.");
		return;
	}

	try {
		await fs.access(path);
	} catch {
		logger.warn(`Path ${path} does not exist. Skipping unmount.`);
		return;
	}

	const cmd = `umount -f ${path}`;

	return new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("Mount command timed out"));
		}, 5000);

		exec(cmd, (error, stdout, stderr) => {
			logger.info("Unmount command executed:", { cmd, error, stdout, stderr });
			clearTimeout(timeout);

			if (error) {
				logger.error(`Error unmounting NFS volume: ${stderr}`);
				return reject(new Error(`Failed to unmount NFS volume: ${stderr}`));
			}

			fs.rmdir(path).catch((rmdirError) => {
				logger.error(`Failed to remove directory ${path}:`, rmdirError);
			});

			logger.info(`NFS volume unmounted successfully: ${stdout}`);
			resolve();
		});
	});
};

const checkHealth = async (path: string) => {
	try {
		await fs.access(path);

		// Try to create a temporary file to ensure the mount is writable
		const testFilePath = npath.join(path, `.healthcheck-${Date.now()}`);
		await fs.writeFile(testFilePath, "healthcheck");
		await fs.unlink(testFilePath);

		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("NFS volume health check failed:", error);
		return { status: BACKEND_STATUS.error, error: error instanceof Error ? error.message : String(error) };
	}
};

export const makeNfsBackend = (config: BackendConfig, path: string): VolumeBackend => ({
	mount: () => mount(config, path),
	unmount: () => unmount(path),
	checkHealth: () => checkHealth(path),
});
