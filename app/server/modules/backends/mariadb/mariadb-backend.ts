import * as fs from "node:fs/promises";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import type { VolumeBackend } from "../backend";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";
import { $ } from "bun";

const checkHealth = async (config: BackendConfig) => {
	if (config.backend !== "mariadb") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	try {
		logger.debug(`Testing MariaDB connection to: ${config.host}:${config.port}`);

		const args = [
			`--host=${config.host}`,
			`--port=${config.port}`,
			`--user=${config.username}`,
			`--database=${config.database}`,
			"--skip-ssl",
			"--execute=SELECT 1",
		];

		const env = {
			MYSQL_PWD: config.password,
		};

		await $`mariadb ${args.join(" ")}`.env(env);

		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("MariaDB health check failed:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

const getBackupPath = async (config: BackendConfig) => {
	const dumpDir = await fs.mkdtemp(`/tmp/ironmount-mariadb-`);

	if (config.backend !== "mariadb") {
		throw new Error("Invalid backend type for MariaDB dump");
	}

	logger.info(`Starting MariaDB dump for database: ${config.database}`);

	const args = [
		`--host=${config.host}`,
		`--port=${config.port}`,
		`--user=${config.username}`,
		`--skip-ssl`,
		`--single-transaction`,
		`--quick`,
		`--lock-tables=false`,
		...(config.dumpOptions || []),
		config.database,
	];

	const env = {
		MYSQL_PWD: config.password,
	};

	const result = await $`mariadb-dump ${args}`.env(env).nothrow();

	if (result.exitCode !== 0) {
		throw new Error(`mariadb-dump failed with exit code ${result.exitCode}: ${result.stderr}`);
	}

	await fs.writeFile(`${dumpDir}/dump.sql`, result.stdout);
	logger.info(`MariaDB dump completed: ${dumpDir}/dump.sql`);

	return `${dumpDir}/dump.sql`;
};

export const makeMariaDBBackend = (config: BackendConfig): VolumeBackend => ({
	mount: () => Promise.resolve({ status: BACKEND_STATUS.mounted }),
	unmount: () => Promise.resolve({ status: BACKEND_STATUS.unmounted }),
	checkHealth: () => checkHealth(config),
	getVolumePath: () => "/tmp",
	getBackupPath: () => getBackupPath(config),
});
