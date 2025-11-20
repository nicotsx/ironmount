import * as fs from "node:fs/promises";
import { toMessage } from "../../../utils/errors";
import { logger } from "../../../utils/logger";
import type { VolumeBackend } from "../backend";
import { BACKEND_STATUS, type BackendConfig } from "~/schemas/volumes";
import { $ } from "bun";

const checkHealth = async (config: BackendConfig) => {
	if (config.backend !== "postgres") {
		return { status: BACKEND_STATUS.error, error: "Invalid backend type" };
	}

	if (config.backend !== "postgres") {
		throw new Error("Invalid backend type for PostgreSQL connection test");
	}

	logger.debug(`Testing PostgreSQL connection to: ${config.host}:${config.port}`);

	const args = [
		`--host=${config.host}`,
		`--port=${config.port}`,
		`--username=${config.username}`,
		`--dbname=${config.database}`,
		"--command=SELECT 1",
		"--no-password",
	];

	const env = {
		PGPASSWORD: config.password,
		PGSSLMODE: "disable",
	};

	logger.debug(`Running psql with args: ${args.join(" ")}`);
	const res = await $`psql ${args}`.env(env).nothrow();

	if (res.exitCode !== 0) {
		return { status: BACKEND_STATUS.error, error: res.stderr.toString() };
	}

	return { status: BACKEND_STATUS.mounted };
};

const getBackupPath = async (config: BackendConfig) => {
	if (config.backend !== "postgres") {
		throw new Error("Invalid backend type for PostgreSQL dump");
	}

	const dumpDir = await fs.mkdtemp(`/tmp/ironmount-postgres-`);
	const outputPath = `${dumpDir}/${config.dumpFormat === "plain" ? "dump.sql" : "dump.dump"}`;

	logger.info(`Starting PostgreSQL dump for database: ${config.database}`);

	const args = [
		`--host=${config.host}`,
		`--port=${config.port}`,
		`--username=${config.username}`,
		`--dbname=${config.database}`,
		`--format=${config.dumpFormat}`,
		`--file=${outputPath}`,
		"--no-password",
		...(config.dumpOptions || []),
	];

	const env = {
		PGPASSWORD: config.password,
		PGSSLMODE: "disable",
	};

	await $`pg_dump ${args}`.env(env);

	return outputPath;
};

export const makePostgresBackend = (config: BackendConfig): VolumeBackend => ({
	mount: () => Promise.resolve({ status: "mounted" }),
	unmount: () => Promise.resolve({ status: "unmounted" }),
	checkHealth: () => checkHealth(config),
	getVolumePath: () => "/tmp",
	getBackupPath: () => getBackupPath(config),
});
