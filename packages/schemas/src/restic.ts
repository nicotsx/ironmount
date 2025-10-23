import { type } from "arktype";

export const REPOSITORY_BACKENDS = {
	local: "local",
	s3: "s3",
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
	path: "string",
});

export const repositoryConfigSchema = s3RepositoryConfigSchema.or(localRepositoryConfigSchema);

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
