import { type } from "arktype";

export const REPOSITORY_BACKENDS = {
	local: "local",
	s3: "s3",
	gcs: "gcs",
	azure: "azure",
} as const;

export type RepositoryBackend = keyof typeof REPOSITORY_BACKENDS;

export const s3RepositoryConfigSchema = type({
	backend: "'s3'",
	endpoint: "string",
	bucket: "string",
	accessKeyId: "string",
	secretAccessKey: "string",
});

export const localRepositoryConfigSchema = type({
	backend: "'local'",
	name: "string",
});

export const gcsRepositoryConfigSchema = type({
	backend: "'gcs'",
	bucket: "string",
	projectId: "string",
	credentialsJson: "string",
});

export const azureRepositoryConfigSchema = type({
	backend: "'azure'",
	container: "string",
	accountName: "string",
	accountKey: "string",
	endpointSuffix: "string?",
});

export const repositoryConfigSchema = s3RepositoryConfigSchema
	.or(localRepositoryConfigSchema)
	.or(gcsRepositoryConfigSchema)
	.or(azureRepositoryConfigSchema);

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
