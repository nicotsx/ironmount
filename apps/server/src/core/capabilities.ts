import * as fs from "node:fs/promises";
import Docker from "dockerode";
import { logger } from "../utils/logger";

export type SystemCapabilities = {
	docker: boolean;
	hostProc: boolean;
};

let capabilitiesPromise: Promise<SystemCapabilities> | null = null;

/**
 * Returns the current system capabilities.
 * On first call, detects all capabilities and caches the promise.
 * Subsequent calls return the same cached promise, ensuring detection only happens once.
 */
export async function getCapabilities(): Promise<SystemCapabilities> {
	if (capabilitiesPromise === null) {
		// Start detection and cache the promise
		capabilitiesPromise = detectCapabilities();
	}

	return capabilitiesPromise;
}

/**
 * Detects which optional capabilities are available in the current environment
 */
async function detectCapabilities(): Promise<SystemCapabilities> {
	return {
		docker: await detectDocker(),
		hostProc: await detectHostProc(),
	};
}

/**
 * Checks if Docker is available by:
 * 1. Checking if /var/run/docker.sock exists and is accessible
 * 2. Attempting to ping the Docker daemon
 */
async function detectDocker(): Promise<boolean> {
	try {
		await fs.access("/var/run/docker.sock");

		const docker = new Docker();
		await docker.ping();

		logger.info("Docker capability: enabled");
		return true;
	} catch (_) {
		logger.warn(
			"Docker capability: disabled. " +
				"To enable: mount /var/run/docker.sock and /run/docker/plugins in docker-compose.yml",
		);
		return false;
	}
}

/**
 * Checks if host proc is available by attempting to access /host/proc/1/ns/mnt
 * This allows using nsenter to execute mount commands in the host namespace
 */
async function detectHostProc(): Promise<boolean> {
	try {
		await fs.access("/host/proc/1/ns/mnt");

		logger.info("Host proc capability: enabled");
		return true;
	} catch (_) {
		logger.warn(
			"Host proc capability: disabled. " +
				"To enable: mount /proc:/host/proc:ro in docker-compose.yml. " +
				"Mounts will be executed in container namespace instead of host namespace.",
		);
		return false;
	}
}
