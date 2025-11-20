import * as fs from "node:fs/promises";
import * as os from "node:os";
import { OPERATION_TIMEOUT } from "../../../core/constants";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { getMountForPath } from "../../../utils/mountinfo";
import { withTimeout } from "../../../utils/timeout";
import type { VolumeBackend } from "../backend";
import { executeMount, executeUnmount } from "../utils/backend-utils";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";

const mount = async (config: BackendConfig, path: string) => {
	logger.debug(`Mounting volume ${path}...`);

	if (config.backend !== "nfs") {
		logger.error("Provided config is not for NFS backend");
		return { status: BACKEND_STATUS.error, error: "Provided config is not for NFS backend" };
	}

	if (os.platform() !== "linux") {
		logger.error("NFS mounting is only supported on Linux hosts.");
		return { status: BACKEND_STATUS.error, error: "NFS mounting is only supported on Linux hosts." };
	}

	const { status } = await checkHealth(path);
	if (status === "mounted") {
		return { status: BACKEND_STATUS.mounted };
	}

	logger.debug(`Trying to unmount any existing mounts at ${path} before mounting...`);
	await unmount(path);

	const run = async () => {
		await fs.mkdir(path, { recursive: true });

		const source = `${config.server}:${config.exportPath}`;
		const options = [`vers=${config.version}`, `port=${config.port}`];
		if (config.readOnly) {
			options.push("ro");
		}
		const args = ["-t", "nfs", "-o", options.join(","), source, path];

		logger.debug(`Mounting volume ${path}...`);
		logger.info(`Executing mount: mount ${args.join(" ")}`);

		await executeMount(args);

		logger.info(`NFS volume at ${path} mounted successfully.`);
		return { status: BACKEND_STATUS.mounted };
	};

	try {
		return await withTimeout(run(), OPERATION_TIMEOUT, "NFS mount");
	} catch (err) {
		logger.error("Error mounting NFS volume", { error: toMessage(err) });
		return { status: BACKEND_STATUS.error, error: toMessage(err) };
	}
};

const unmount = async (path: string) => {
	if (os.platform() !== "linux") {
		logger.error("NFS unmounting is only supported on Linux hosts.");
		return { status: BACKEND_STATUS.error, error: "NFS unmounting is only supported on Linux hosts." };
	}

	const run = async () => {
		try {
			await fs.access(path);
		} catch {
			logger.warn(`Path ${path} does not exist. Skipping unmount.`);
			return { status: BACKEND_STATUS.unmounted };
		}

		await executeUnmount(path);

		await fs.rmdir(path);

		logger.info(`NFS volume at ${path} unmounted successfully.`);
		return { status: BACKEND_STATUS.unmounted };
	};

	try {
		return await withTimeout(run(), OPERATION_TIMEOUT, "NFS unmount");
	} catch (err) {
		logger.error("Error unmounting NFS volume", { path, error: toMessage(err) });
		return { status: BACKEND_STATUS.error, error: toMessage(err) };
	}
};

const checkHealth = async (path: string) => {
	const run = async () => {
		logger.debug(`Checking health of NFS volume at ${path}...`);
		await fs.access(path);

		const mount = await getMountForPath(path);

		if (!mount || !mount.fstype.startsWith("nfs")) {
			throw new Error(`Path ${path} is not mounted as NFS.`);
		}

		logger.debug(`NFS volume at ${path} is healthy and mounted.`);
		return { status: BACKEND_STATUS.mounted };
	};

	try {
		return await withTimeout(run(), OPERATION_TIMEOUT, "NFS health check");
	} catch (error) {
		logger.error("NFS volume health check failed:", toMessage(error));
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

export const makeNfsBackend = (config: BackendConfig, path: string): VolumeBackend => ({
	mount: () => mount(config, path),
	unmount: () => unmount(path),
	checkHealth: () => checkHealth(path),
});
