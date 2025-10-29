import {
	COMPRESSION_MODES,
	REPOSITORY_BACKENDS,
	REPOSITORY_STATUS,
	repositoryConfigSchema,
} from "@ironmount/schemas/restic";
import { type } from "arktype";
import { describeRoute, resolver } from "hono-openapi";

const repositorySchema = type({
	id: "string",
	name: "string",
	type: type.valueOf(REPOSITORY_BACKENDS),
	config: repositoryConfigSchema,
	compressionMode: type.valueOf(COMPRESSION_MODES).or("null"),
	status: type.valueOf(REPOSITORY_STATUS).or("null"),
	lastChecked: "number | null",
	lastError: "string | null",
	createdAt: "number",
	updatedAt: "number",
});

export type RepositoryDto = typeof repositorySchema.infer;

/**
 * List all repositories
 */
export const listRepositoriesResponse = repositorySchema.array();
export type ListRepositoriesDto = typeof listRepositoriesResponse.infer;

export const listRepositoriesDto = describeRoute({
	description: "List all repositories",
	tags: ["Repositories"],
	operationId: "listRepositories",
	responses: {
		200: {
			description: "List of repositories",
			content: {
				"application/json": {
					schema: resolver(listRepositoriesResponse),
				},
			},
		},
	},
});

/**
 * Create a new repository
 */
export const createRepositoryBody = type({
	name: "string",
	compressionMode: type.valueOf(COMPRESSION_MODES).optional(),
	config: repositoryConfigSchema,
});

export type CreateRepositoryBody = typeof createRepositoryBody.infer;

export const createRepositoryResponse = type({
	message: "string",
	repository: type({
		id: "string",
		name: "string",
	}),
});

export type CreateRepositoryDto = typeof createRepositoryResponse.infer;

export const createRepositoryDto = describeRoute({
	description: "Create a new restic repository",
	operationId: "createRepository",
	tags: ["Repositories"],
	responses: {
		201: {
			description: "Repository created successfully",
			content: {
				"application/json": {
					schema: resolver(createRepositoryResponse),
				},
			},
		},
	},
});

/**
 * Get a single repository
 */
export const getRepositoryResponse = repositorySchema;
export type GetRepositoryDto = typeof getRepositoryResponse.infer;

export const getRepositoryDto = describeRoute({
	description: "Get a single repository by name",
	tags: ["Repositories"],
	operationId: "getRepository",
	responses: {
		200: {
			description: "Repository details",
			content: {
				"application/json": {
					schema: resolver(getRepositoryResponse),
				},
			},
		},
	},
});

/**
 * Delete a repository
 */
export const deleteRepositoryResponse = type({
	message: "string",
});

export type DeleteRepositoryDto = typeof deleteRepositoryResponse.infer;

export const deleteRepositoryDto = describeRoute({
	description: "Delete a repository",
	tags: ["Repositories"],
	operationId: "deleteRepository",
	responses: {
		200: {
			description: "Repository deleted successfully",
			content: {
				"application/json": {
					schema: resolver(deleteRepositoryResponse),
				},
			},
		},
	},
});

/**
 * List snapshots in a repository
 */
export const snapshotSchema = type({
	short_id: "string",
	time: "number",
	paths: "string[]",
	size: "number",
	duration: "number",
});

const listSnapshotsResponse = type({
	snapshots: snapshotSchema.array(),
});

export type ListSnapshotsDto = typeof listSnapshotsResponse.infer;

export const listSnapshotsDto = describeRoute({
	description: "List all snapshots in a repository",
	tags: ["Repositories"],
	operationId: "listSnapshots",
	responses: {
		200: {
			description: "List of snapshots",
			content: {
				"application/json": {
					schema: resolver(listSnapshotsResponse),
				},
			},
		},
	},
});
