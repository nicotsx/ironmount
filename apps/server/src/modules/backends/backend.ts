import type { BackendStatus } from "@ironmount/schemas";
import type { Volume } from "../../db/schema";
import { makeDirectoryBackend } from "./directory/directory-backend";
import { makeNfsBackend } from "./nfs/nfs-backend";
import { VOLUME_MOUNT_BASE } from "../../core/constants";

type OperationResult = {
	error?: string;
	status: BackendStatus;
};

export type VolumeBackend = {
	mount: () => Promise<OperationResult>;
	unmount: () => Promise<OperationResult>;
	checkHealth: () => Promise<OperationResult>;
};

export const createVolumeBackend = (volume: Volume): VolumeBackend => {
	const path = `${VOLUME_MOUNT_BASE}/${volume.name}/_data`;

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
