import { type } from "arktype";

export const BACKEND_TYPES = {
	nfs: "nfs",
	smb: "smb",
	directory: "directory",
	webdav: "webdav",
} as const;

export type BackendType = keyof typeof BACKEND_TYPES;

export const nfsConfigSchema = type({
	backend: "'nfs'",
	server: "string",
	exportPath: "string",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65536").default(2049),
	version: "'3' | '4' | '4.1'",
});

export const smbConfigSchema = type({
	backend: "'smb'",
	server: "string",
	share: "string",
	username: "string",
	password: "string",
	vers: type("'1.0' | '2.0' | '2.1' | '3.0'").default("3.0"),
	domain: "string | undefined?",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65535").default(445),
});

export const directoryConfigSchema = type({
	backend: "'directory'",
});

export const webdavConfigSchema = type({
	backend: "'webdav'",
	server: "string",
	path: "string",
	username: "string | undefined?",
	password: "string | undefined?",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65536").default(80),
	ssl: "boolean?",
});

export const volumeConfigSchemaNoUndefined = nfsConfigSchema
	.or(smbConfigSchema.omit("domain").and(type({ domain: "string?" })))
	.or(webdavConfigSchema.omit("username", "password").and(type({ username: "string?", password: "string?" })))
	.or(directoryConfigSchema);

export const volumeConfigSchema = nfsConfigSchema.or(smbConfigSchema).or(webdavConfigSchema).or(directoryConfigSchema);

export type BackendConfig = typeof volumeConfigSchema.infer;

export const BACKEND_STATUS = {
	mounted: "mounted",
	unmounted: "unmounted",
	error: "error",
} as const;

export type BackendStatus = keyof typeof BACKEND_STATUS;
