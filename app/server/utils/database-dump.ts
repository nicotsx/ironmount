import * as fs from "node:fs/promises";
import * as path from "node:path";
import { safeSpawn } from "./spawn";
import { logger } from "./logger";
import { toMessage } from "./errors";
import type { BackendConfig } from "~/schemas/volumes";

export type DatabaseConfig = Extract<
	BackendConfig,
	{ backend: "mariadb" | "mysql" | "postgres" | "sqlite" }
>;

// MariaDB
export const dumpMariaDB = async (config: DatabaseConfig, outputPath: string): Promise<void> => {
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
		...process.env,
		MYSQL_PWD: config.password,
	};

	try {
		const result = await safeSpawn({ command: "mariadb-dump", args, env });
		await fs.writeFile(outputPath, result.stdout);
		logger.info(`MariaDB dump completed: ${outputPath}`);
	} catch (error) {
		logger.error(`MariaDB dump failed: ${toMessage(error)}`);
		throw error;
	}
};

export const testMariaDBConnection = async (config: DatabaseConfig): Promise<void> => {
	if (config.backend !== "mariadb") {
		throw new Error("Invalid backend type for MariaDB connection test");
	}

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
		...process.env,
		MYSQL_PWD: config.password,
	};

	try {
		await safeSpawn({ command: "mariadb", args, env, timeout: 10000 });
		logger.debug("MariaDB connection test successful");
	} catch (error) {
		logger.error(`MariaDB connection test failed: ${toMessage(error)}`);
		throw error;
	}
};

// MySQL
export const dumpMySQL = async (config: DatabaseConfig, outputPath: string): Promise<void> => {
	if (config.backend !== "mysql") {
		throw new Error("Invalid backend type for MySQL dump");
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
		...process.env,
		MYSQL_PWD: config.password,
	};

	try {
		const result = await safeSpawn({ command: "mysqldump", args, env });
		await fs.writeFile(outputPath, result.stdout);
		logger.info(`MySQL dump completed: ${outputPath}`);
	} catch (error) {
		logger.error(`MySQL dump failed: ${toMessage(error)}`);
		throw error;
	}
};

export const testMySQLConnection = async (config: DatabaseConfig): Promise<void> => {
	if (config.backend !== "mysql") {
		throw new Error("Invalid backend type for MySQL connection test");
	}

	logger.debug(`Testing MySQL connection to: ${config.host}:${config.port}`);

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

	try {
		await safeSpawn({ command: "mysql", args, env, timeout: 10000 });
		logger.debug("MySQL connection test successful");
	} catch (error) {
		logger.error(`MySQL connection test failed: ${toMessage(error)}`);
		throw error;
	}
};

// PostgreSQL
export const dumpPostgres = async (config: DatabaseConfig, outputPath: string): Promise<void> => {
	if (config.backend !== "postgres") {
		throw new Error("Invalid backend type for PostgreSQL dump");
	}

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
		...process.env,
		PGPASSWORD: config.password,
		PGSSLMODE: "disable",
	};

	try {
		await safeSpawn({ command: "pg_dump", args, env });
		logger.info(`PostgreSQL dump completed: ${outputPath}`);
	} catch (error) {
		logger.error(`PostgreSQL dump failed: ${toMessage(error)}`);
		throw error;
	}
};

export const testPostgresConnection = async (config: DatabaseConfig): Promise<void> => {
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
		...process.env,
		PGPASSWORD: config.password,
		PGSSLMODE: "disable",
	};

	try {
		await safeSpawn({ command: "psql", args, env, timeout: 10000 });
		logger.debug("PostgreSQL connection test successful");
	} catch (error) {
		logger.error(`PostgreSQL connection test failed: ${toMessage(error)}`);
		throw error;
	}
};

// SQLite
export const dumpSQLite = async (config: DatabaseConfig, outputPath: string): Promise<void> => {
	if (config.backend !== "sqlite") {
		throw new Error("Invalid backend type for SQLite dump");
	}

	logger.info(`Starting SQLite dump for database: ${config.path}`);

	try {
		await fs.access(config.path);

		const result = await safeSpawn({ command: "sqlite3", args: [config.path, ".dump"] });
		await fs.writeFile(outputPath, result.stdout);
		logger.info(`SQLite dump completed: ${outputPath}`);
	} catch (error) {
		logger.error(`SQLite dump failed: ${toMessage(error)}`);
		throw error;
	}
};

export const testSQLiteConnection = async (config: DatabaseConfig): Promise<void> => {
	if (config.backend !== "sqlite") {
		throw new Error("Invalid backend type for SQLite connection test");
	}

	logger.debug(`Testing SQLite connection to: ${config.path}`);

	try {
		await fs.access(config.path, fs.constants.R_OK);
		const result = await safeSpawn({ command: "sqlite3", args: [config.path, "SELECT 1"] });

		if (!result.stdout.includes("1")) {
			throw new Error("SQLite database query failed");
		}

		logger.debug("SQLite connection test successful");
	} catch (error) {
		logger.error(`SQLite connection test failed: ${toMessage(error)}`);
		throw error;
	}
};

// Utils
export const executeDatabaseDump = async (config: DatabaseConfig, outputPath: string): Promise<void> => {
	const outputDir = path.dirname(outputPath);
	await fs.mkdir(outputDir, { recursive: true });

	switch (config.backend) {
		case "mariadb":
			return dumpMariaDB(config, outputPath);
		case "mysql":
			return dumpMySQL(config, outputPath);
		case "postgres":
			return dumpPostgres(config, outputPath);
		case "sqlite":
			return dumpSQLite(config, outputPath);
		default:
			throw new Error(`Unsupported database backend: ${(config as any).backend}`);
	}
};

export const testDatabaseConnection = async (config: DatabaseConfig): Promise<void> => {
	switch (config.backend) {
		case "mariadb":
			return testMariaDBConnection(config);
		case "mysql":
			return testMySQLConnection(config);
		case "postgres":
			return testPostgresConnection(config);
		case "sqlite":
			return testSQLiteConnection(config);
		default:
			throw new Error(`Unsupported database backend: ${(config as any).backend}`);
	}
};