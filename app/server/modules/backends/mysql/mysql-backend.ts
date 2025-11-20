import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import type { VolumeBackend } from "../backend";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";
import { $ } from "bun";

const checkHealth = async (config: BackendConfig) => {
	if (config.backend !== "mysql") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	logger.debug(`Testing MySQL connection to: ${config.host}:${config.port}`);
	try {
		const args = [
			`--host=${config.host}`,
			`--port=${config.port}`,
			`--user=${config.username}`,
			`--database=${config.database}`,
			"--skip-ssl",
			"--execute=SELECT 1",
		];

		const env = {
			...process.env,
			MYSQL_PWD: config.password,
		};

		await $`mysql ${args.join(" ")}`.env(env);
		return { status: BACKEND_STATUS.mounted };
	} catch (error) {
		logger.error("MySQL health check failed:", error);
		return { status: BACKEND_STATUS.error, error: toMessage(error) };
	}
};

const getBackupPath = async (config: BackendConfig) => {
	if (config.backend !== "mysql") {
		throw new Error("Invalid backend type");
	}

	logger.info(`Starting MySQL dump for database: ${config.database}`);

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

	const result = await $`mysql ${args}`.env(env).nothrow();

	if (result.exitCode !== 0) {
		throw new Error(`MySQL dump failed: ${result.stderr}`);
	}

	console.log(result.stdout);

	return "Nothing for now";
};

export const makeMySQLBackend = (config: BackendConfig): VolumeBackend => ({
	mount: () => Promise.resolve({ status: BACKEND_STATUS.mounted }),
	unmount: () => Promise.resolve({ status: BACKEND_STATUS.unmounted }),
	checkHealth: () => checkHealth(config),
	getVolumePath: () => "/tmp",
	getBackupPath: () => getBackupPath(config),
});
