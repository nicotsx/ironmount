import { type } from "arktype";

export const BACKEND_TYPES = {
	nfs: "nfs",
	smb: "smb",
	directory: "directory",
} as const;

export type BackendType = keyof typeof BACKEND_TYPES;

export const nfsConfigSchema = type({
	backend: "'nfs'",
	server: "string",
	exportPath: "string",
	port: type("string.integer.parse").or(type("number")).to("1 <= number <= 65536").default("2049"),
	version: "'3' | '4' | '4.1'",
});

export const smbConfigSchema = type({
	backend: "'smb'",
});

export const directoryConfigSchema = type({
	backend: "'directory'",
});

export const volumeConfigSchema = nfsConfigSchema.or(smbConfigSchema).or(directoryConfigSchema);

export type BackendConfig = typeof volumeConfigSchema.infer;

export const BACKEND_STATUS = {
	mounted: "mounted",
	unmounted: "unmounted",
	error: "error",
} as const;

export type BackendStatus = keyof typeof BACKEND_STATUS;
