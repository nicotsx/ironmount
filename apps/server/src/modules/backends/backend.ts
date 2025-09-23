import type { BackendStatus } from "@ironmount/schemas";
import type { Volume } from "../../db/schema";
import { makeDirectoryBackend } from "./directory/directory-backend";
import { makeNfsBackend } from "./nfs/nfs-backend";
import { config } from "../../core/config";

export type VolumeBackend = {
	mount: () => Promise<void>;
	unmount: () => Promise<void>;
	checkHealth: () => Promise<{ error?: string; status: BackendStatus }>;
};

export const createVolumeBackend = (volume: Volume): VolumeBackend => {
	const path = `${config.volumeRootContainer}/${volume.name}/_data`;

	switch (volume.config.backend) {
		case "nfs": {
			return makeNfsBackend(volume.config, path);
		}
		case "directory": {
			return makeDirectoryBackend(volume.config, path);
		}
		default: {
			throw new Error(`Backend ${volume.config.backend} not implemented`);
		}
	}
};
