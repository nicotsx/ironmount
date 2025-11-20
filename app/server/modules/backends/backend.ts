import type { BackendStatus } from "~/schemas/volumes";
import type { Volume } from "../../db/schema";
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
	getBackupPath: () => Promise<string>;
};

export const createVolumeBackend = (volume: Volume): VolumeBackend => {
	switch (volume.config.backend) {
		case "nfs": {
			return makeNfsBackend(volume.config, volume.name);
		}
		case "smb": {
			return makeSmbBackend(volume.config, volume.name);
		}
		case "directory": {
			return makeDirectoryBackend(volume.config, volume.name);
		}
		case "webdav": {
			return makeWebdavBackend(volume.config, volume.name);
		}
		case "mariadb": {
			return makeMariaDBBackend(volume.config);
		}
		case "mysql": {
			return makeMySQLBackend(volume.config);
		}
		case "postgres": {
			return makePostgresBackend(volume.config);
		}
		default: {
			throw new Error(`Unsupported backend type: ${(volume.config as any).backend}`);
		}
	}
};
