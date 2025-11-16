import type { BackendStatus } from "~/schemas/volumes";
import type { Volume } from "../../db/schema";
import { VOLUME_MOUNT_BASE } from "../../core/constants";
import { makeDirectoryBackend } from "./directory/directory-backend";
import { makeNfsBackend } from "./nfs/nfs-backend";
import { makeSmbBackend } from "./smb/smb-backend";
import { makeWebdavBackend } from "./webdav/webdav-backend";
import { makeMariaDBBackend } from "./mariadb/mariadb-backend";
import { makeMySQLBackend } from "./mysql/mysql-backend";
import { makePostgresBackend } from "./postgres/postgres-backend";

type OperationResult = {
	error?: string;
	status: BackendStatus;
};

export type VolumeBackend = {
	mount: () => Promise<OperationResult>;
	unmount: () => Promise<OperationResult>;
	checkHealth: () => Promise<OperationResult>;
	getVolumePath: () => string;
	isDatabaseBackend: () => boolean;
	getDumpPath: () => string | null;
	getDumpFilePath: (timestamp: number) => string | null;
};

export const createVolumeBackend = (volume: Volume): VolumeBackend => {
	const path = volume.config.backend === "directory"
		? volume.config.path
		: `${VOLUME_MOUNT_BASE}/${volume.name}/_data`;

	switch (volume.config.backend) {
		case "nfs": {
			return makeNfsBackend(volume.config, volume.name, path);
		}
		case "smb": {
			return makeSmbBackend(volume.config, volume.name, path);
		}
		case "directory": {
			return makeDirectoryBackend(volume.config, volume.name, path);
		}
		case "webdav": {
			return makeWebdavBackend(volume.config, volume.name, path);
		}
		case "mariadb": {
			return makeMariaDBBackend(volume.config, volume.name, path);
		}
		case "mysql": {
			return makeMySQLBackend(volume.config, volume.name, path);
		}
		case "postgres": {
			return makePostgresBackend(volume.config, volume.name, path);
		}
		default: {
			throw new Error(`Unsupported backend type: ${(volume.config as any).backend}`);
		}
	}
};
