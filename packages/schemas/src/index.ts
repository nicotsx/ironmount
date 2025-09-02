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
	port: "number >= 1",
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
