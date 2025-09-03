import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import type { BackendConfig } from "@ironmount/schemas";
import type { VolumeBackend } from "../backend";

const mount = async (config: BackendConfig, path: string) => {
	if (config.backend !== "nfs") {
		throw new Error("Invalid backend config for NFS");
	}

	if (os.platform() !== "linux") {
		console.error("NFS mounting is only supported on Linux hosts.");
		return;
	}

	await fs.mkdir(path, { recursive: true });

	const source = `${config.server}:${config.exportPath}`;
	const options = [`vers=${config.version}`, `port=${config.port}`];
	const cmd = `mount -t nfs -o ${options.join(",")} ${source} ${path}`;

	return new Promise<void>((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			console.log("Mount command executed:", { cmd, error, stdout, stderr });
			if (error) {
				// console.error(`Error mounting NFS volume: ${stderr}`);
				return reject(new Error(`Failed to mount NFS volume: ${stderr}`));
			}
			console.log(`NFS volume mounted successfully: ${stdout}`);
			resolve();
		});
	});
};

const unmount = async (path: string) => {
	if (os.platform() !== "linux") {
		console.error("NFS unmounting is only supported on Linux hosts.");
		return;
	}

	const cmd = `umount -f ${path}`;

	return new Promise<void>((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			console.log("Unmount command executed:", { cmd, error, stdout, stderr });
			if (error) {
				console.error(`Error unmounting NFS volume: ${stderr}`);
				return reject(new Error(`Failed to unmount NFS volume: ${stderr}`));
			}
			console.log(`NFS volume unmounted successfully: ${stdout}`);
			resolve();
		});
	});
};

export const makeNfsBackend = (config: BackendConfig, path: string): VolumeBackend => ({
	mount: () => mount(config, path),
	unmount: () => unmount(path),
});
