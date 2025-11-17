import { type } from "arktype";

export const REPOSITORY_BACKENDS = {
	local: "local",
	s3: "s3",
	r2: "r2",
	gcs: "gcs",
	azure: "azure",
	rclone: "rclone",
	sftp: "sftp",
} as const;

export type RepositoryBackend = keyof typeof REPOSITORY_BACKENDS;

// Common fields for all repository configs
const baseRepositoryConfigSchema = type({
	isExistingRepository: "boolean?",
	customPassword: "string?",
});

export const s3RepositoryConfigSchema = type({
	backend: "'s3'",
	endpoint: "string",
	bucket: "string",
	accessKeyId: "string",
	secretAccessKey: "string",
}).and(baseRepositoryConfigSchema);

export const r2RepositoryConfigSchema = type({
	backend: "'r2'",
	endpoint: "string",
	bucket: "string",
	accessKeyId: "string",
	secretAccessKey: "string",
}).and(baseRepositoryConfigSchema);

export const localRepositoryConfigSchema = type({
	backend: "'local'",
	name: "string",
}).and(baseRepositoryConfigSchema);

export const gcsRepositoryConfigSchema = type({
	backend: "'gcs'",
	bucket: "string",
	projectId: "string",
	credentialsJson: "string",
}).and(baseRepositoryConfigSchema);

export const azureRepositoryConfigSchema = type({
	backend: "'azure'",
	container: "string",
	accountName: "string",
	accountKey: "string",
	endpointSuffix: "string?",
}).and(baseRepositoryConfigSchema);

export const rcloneRepositoryConfigSchema = type({
	backend: "'rclone'",
	remote: "string",
	path: "string",
}).and(baseRepositoryConfigSchema);

export const sftpRepositoryConfigSchema = type({
	backend: "'sftp'",
	server: "string",
	port: type("string.integer").or(type("number")).to("1 <= number <= 65536").default(22),
	username: "string",
	password: "string",
	path: "string",
}).and(baseRepositoryConfigSchema);

export const repositoryConfigSchema = s3RepositoryConfigSchema
	.or(r2RepositoryConfigSchema)
	.or(localRepositoryConfigSchema)
	.or(gcsRepositoryConfigSchema)
	.or(azureRepositoryConfigSchema)
	.or(rcloneRepositoryConfigSchema)
	.or(sftpRepositoryConfigSchema);

export type RepositoryConfig = typeof repositoryConfigSchema.infer;

export const COMPRESSION_MODES = {
	off: "off",
	auto: "auto",
	fastest: "fastest",
	better: "better",
	max: "max",
} as const;

export type CompressionMode = keyof typeof COMPRESSION_MODES;

export const REPOSITORY_STATUS = {
	healthy: "healthy",
	error: "error",
	unknown: "unknown",
} as const;

export type RepositoryStatus = keyof typeof REPOSITORY_STATUS;
