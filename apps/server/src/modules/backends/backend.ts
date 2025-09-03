import type { BackendStatus } from "@ironmount/schemas";
import type { Volume } from "../../db/schema";
import { makeDirectoryBackend } from "./directory/directory-backend";
import { makeNfsBackend } from "./nfs/nfs-backend";

export type VolumeBackend = {
	mount: () => Promise<void>;
	unmount: () => Promise<void>;
	checkHealth: () => Promise<{ error?: string; status: BackendStatus }>;
};

export const createVolumeBackend = (volume: Volume): VolumeBackend => {
	const { config, path } = volume;

	switch (config.backend) {
		case "nfs": {
			return makeNfsBackend(config, path);
		}
		case "directory": {
			return makeDirectoryBackend(config, path);
		}
		default: {
			throw new Error(`Backend ${config.backend} not implemented`);
		}
	}
};
