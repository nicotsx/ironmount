import { type } from "arktype";

export const BACKEND_TYPES = {
	nfs: "nfs",
	smb: "smb",
	directory: "directory",
	webdav: "webdav",
	mariadb: "mariadb",
	mysql: "mysql",
	postgres: "postgres",
} as const;

export type BackendType = keyof typeof BACKEND_TYPES;

export const nfsConfigSchema = type({
	backend: "'nfs'",
	server: "string",
	exportPath: "string",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65536").default(2049),
	version: "'3' | '4' | '4.1'",
	readOnly: "boolean?",
});

export const smbConfigSchema = type({
	backend: "'smb'",
	server: "string",
	share: "string",
	username: "string",
	password: "string",
	vers: type("'1.0' | '2.0' | '2.1' | '3.0'").default("3.0"),
	domain: "string?",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65535").default(445),
	readOnly: "boolean?",
});

export const directoryConfigSchema = type({
	backend: "'directory'",
	path: "string",
	readOnly: "false?",
});

export const webdavConfigSchema = type({
	backend: "'webdav'",
	server: "string",
	path: "string",
	username: "string?",
	password: "string?",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65536").default(80),
	readOnly: "boolean?",
	ssl: "boolean?",
});

export const mariadbConfigSchema = type({
	backend: "'mariadb'",
	host: "string",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65535").default(3306),
	username: "string",
	password: "string",
	database: "string",
	dumpOptions: "string[]?",
});

export const mysqlConfigSchema = type({
	backend: "'mysql'",
	host: "string",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65535").default(3306),
	username: "string",
	password: "string",
	database: "string",
	dumpOptions: "string[]?",
});

export const postgresConfigSchema = type({
	backend: "'postgres'",
	host: "string",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65535").default(5432),
	username: "string",
	password: "string",
	database: "string",
	dumpFormat: type("'plain' | 'custom' | 'directory'").default("custom"),
	dumpOptions: "string[]?",
});

export const volumeConfigSchema = nfsConfigSchema
	.or(smbConfigSchema)
	.or(webdavConfigSchema)
	.or(directoryConfigSchema)
	.or(mariadbConfigSchema)
	.or(mysqlConfigSchema)
	.or(postgresConfigSchema);

export type BackendConfig = typeof volumeConfigSchema.infer;

export const BACKEND_STATUS = {
	mounted: "mounted",
	unmounted: "unmounted",
	error: "error",
} as const;

export type BackendStatus = keyof typeof BACKEND_STATUS;
