import * as fs from "node:fs/promises";
import type { BackendConfig } from "@ironmount/schemas";
import type { VolumeBackend } from "../backend";

const mount = async (_config: BackendConfig, path: string) => {
	console.log("Mounting directory volume...");
	await fs.mkdir(path, { recursive: true });
};

const unmount = async () => {
	console.log("Cannot unmount directory volume.");
};

export const makeDirectoryBackend = (config: BackendConfig, path: string): VolumeBackend => ({
	mount: () => mount(config, path),
	unmount,
});
