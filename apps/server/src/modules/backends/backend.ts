import type { BackendStatus } from "@ironmount/schemas";
import { VOLUME_MOUNT_BASE } from "../../core/constants";
import type { Volume } from "../../db/schema";
import { makeDirectoryBackend } from "./directory/directory-backend";
import { makeNfsBackend } from "./nfs/nfs-backend";
import { makeSmbBackend } from "./smb/smb-backend";
import { makeWebdavBackend } from "./webdav/webdav-backend";

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
		case "smb": {
			return makeSmbBackend(volume.config, path);
		}
		case "directory": {
			return makeDirectoryBackend(volume.config, path);
		}
		case "webdav": {
			return makeWebdavBackend(volume.config, path);
		}
	}
};
