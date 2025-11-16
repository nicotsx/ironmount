import { spawn } from "node:child_process";

interface Params {
	command: string;
	args: string[];
	env?: NodeJS.ProcessEnv;
	signal?: AbortSignal;
	stdin?: string;
	timeout?: number;
	onStdout?: (data: string) => void;
	onStderr?: (error: string) => void;
	onError?: (error: Error) => Promise<void> | void;
	onClose?: (code: number | null) => Promise<void> | void;
	finally?: () => Promise<void> | void;
}

type SpawnResult = {
	exitCode: number;
	stdout: string;
	stderr: string;
};

export const safeSpawn = (params: Params) => {
	const { command, args, env = {}, signal, stdin, timeout, ...callbacks } = params;

	return new Promise<SpawnResult>((resolve, reject) => {
		let stdoutData = "";
		let stderrData = "";
		let timeoutId: NodeJS.Timeout | undefined;

		const child = spawn(command, args, {
			env: { ...process.env, ...env },
			signal: signal,
		});

		// Handle timeout if specified
		if (timeout) {
			timeoutId = setTimeout(() => {
				child.kill("SIGTERM");
				reject(new Error(`Command timed out after ${timeout}ms`));
			}, timeout);
		}

		child.stdout.on("data", (data) => {
			if (callbacks.onStdout) {
				callbacks.onStdout(data.toString());
			} else {
				stdoutData += data.toString();
			}
		});

		child.stderr.on("data", (data) => {
			if (callbacks.onStderr) {
				callbacks.onStderr(data.toString());
			} else {
				stderrData += data.toString();
			}
		});

		child.on("error", async (error) => {
			if (timeoutId) clearTimeout(timeoutId);
			if (callbacks.onError) {
				await callbacks.onError(error);
			}
			if (callbacks.finally) {
				await callbacks.finally();
			}

			reject(error);
		});

		child.on("close", async (code) => {
			if (timeoutId) clearTimeout(timeoutId);
			if (callbacks.onClose) {
				await callbacks.onClose(code);
			}
			if (callbacks.finally) {
				await callbacks.finally();
			}

			if (code !== 0 && code !== null) {
				reject(new Error(`Command failed with exit code ${code}: ${stderrData || stdoutData}`));
			} else {
				resolve({
					exitCode: code === null ? -1 : code,
					stdout: stdoutData,
					stderr: stderrData,
				});
			}
		});
	});
};
