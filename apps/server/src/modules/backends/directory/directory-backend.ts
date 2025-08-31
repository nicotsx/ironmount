import type { VolumeBackend } from "../backend";

const mount = async () => {
	console.log("Mounting directory volume...");
};

const unmount = async () => {
	console.log("Cannot unmount directory volume.");
};

export const makeDirectoryBackend = (): VolumeBackend => ({
	mount,
	unmount,
});
