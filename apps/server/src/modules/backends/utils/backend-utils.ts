import * as npath from "node:path";
import * as fs from "node:fs/promises";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { OPERATION_TIMEOUT } from "../../../core/constants";
import { logger } from "../../../utils/logger";

const execFile = promisify(execFileCb);

export const executeMount = async (args: string[]): Promise<void> => {
	const { stderr } = await execFile("mount", args, {
		timeout: OPERATION_TIMEOUT,
		maxBuffer: 1024 * 1024,
	});

	if (stderr?.trim()) {
		logger.warn(stderr.trim());
	}
};

export const executeUnmount = async (path: string): Promise<void> => {
	const { stderr } = await execFile("umount", ["-l", "-f", path], {
		timeout: OPERATION_TIMEOUT,
		maxBuffer: 1024 * 1024,
	});

	if (stderr?.trim()) {
		logger.warn(stderr.trim());
	}
};

export const createTestFile = async (path: string): Promise<void> => {
	const testFilePath = npath.join(path, `.healthcheck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

	await fs.writeFile(testFilePath, "healthcheck");
	await fs.unlink(testFilePath);
};
