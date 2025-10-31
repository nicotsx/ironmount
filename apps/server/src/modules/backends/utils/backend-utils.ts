import { execFile as execFileCb } from "node:child_process";
import * as fs from "node:fs/promises";
import * as npath from "node:path";
import { promisify } from "node:util";
import { OPERATION_TIMEOUT } from "../../../core/constants";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import { access, constants } from "node:fs/promises";

const execFile = promisify(execFileCb);

export const executeMount = async (args: string[]): Promise<void> => {
	let stderr: string | undefined;

	try {
		await access("/host/proc", constants.F_OK);
		const result = await execFile("nsenter", ["--mount=/host/proc/1/ns/mnt", "mount", ...args], {
			timeout: OPERATION_TIMEOUT,
			maxBuffer: 1024 * 1024,
		});
		stderr = result.stderr;
	} catch (_) {
		const result = await execFile("mount", args, {
			timeout: OPERATION_TIMEOUT,
			maxBuffer: 1024 * 1024,
		});
		stderr = result.stderr;
	}

	if (stderr?.trim()) {
		logger.warn(stderr.trim());
	}
};

export const executeUnmount = async (path: string): Promise<void> => {
	let stderr: string | undefined;

	try {
		await access("/host/proc", constants.F_OK);
		const result = await execFile("nsenter", ["--mount=/host/proc/1/ns/mnt", "umount", "-l", "-f", path], {
			timeout: OPERATION_TIMEOUT,
			maxBuffer: 1024 * 1024,
		});
		stderr = result.stderr;
	} catch (_) {
		const result = await execFile("umount", ["-l", "-f", path], {
			timeout: OPERATION_TIMEOUT,
			maxBuffer: 1024 * 1024,
		});
		stderr = result.stderr;
	}

	if (stderr?.trim()) {
		logger.warn(stderr.trim());
	}
};

export const createTestFile = async (path: string): Promise<void> => {
	const testFilePath = npath.join(path, `.healthcheck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

	await fs.writeFile(testFilePath, "healthcheck");

	const files = await fs.readdir(path);
	await Promise.all(
		files.map(async (file) => {
			if (file.startsWith(".healthcheck-")) {
				const filePath = npath.join(path, file);
				try {
					await fs.unlink(filePath);
				} catch (err) {
					logger.warn(`Failed to stat or unlink file ${filePath}: ${toMessage(err)}`);
				}
			}
		}),
	);
};
