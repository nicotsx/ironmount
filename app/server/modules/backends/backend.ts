import type { BackendStatus } from "~/schemas/volumes";
import type { Volume } from "../../db/schema";
import { getVolumePath } from "../volumes/helpers";
import { makeDirectoryBackend } from "./directory/directory-backend";
import { makeNfsBackend } from "./nfs/nfs-backend";
import { makeSmbBackend } from "./smb/smb-backend";
import { makeWebdavBackend } from "./webdav/webdav-backend";
import { makeMariaDBBackend } from "./mariadb/mariadb-backend";
import { makeMySQLBackend } from "./mysql/mysql-backend";
import { makePostgresBackend } from "./postgres/postgres-backend";
import { makeSQLiteBackend } from "./sqlite/sqlite-backend";

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
	const path = getVolumePath(volume);

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
		case "mariadb": {
			return makeMariaDBBackend(volume.config, path);
		}
		case "mysql": {
			return makeMySQLBackend(volume.config, path);
		}
		case "postgres": {
			return makePostgresBackend(volume.config, path);
		}
		case "sqlite": {
			return makeSQLiteBackend(volume.config, path);
		}
		default: {
			throw new Error(`Unsupported backend type: ${(volume.config as any).backend}`);
		}
	}
};
