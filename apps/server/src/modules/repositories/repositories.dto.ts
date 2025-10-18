import { repositoryConfigSchema } from "@ironmount/schemas";
import { type } from "arktype";
import { describeRoute, resolver } from "hono-openapi";

const repositorySchema = type({
	id: "string",
	name: "string",
	backend: type.enumerated("local", "sftp", "s3"),
	config: repositoryConfigSchema,
	compressionMode: type.enumerated("off", "auto", "fastest", "better", "max").or("null"),
	status: type.enumerated("healthy", "error", "unknown").or("null"),
	lastChecked: "number | null",
	lastError: "string | null",
	createdAt: "number",
	updatedAt: "number",
});

export type RepositoryDto = typeof repositorySchema.infer;

/**
 * List all repositories
 */
export const listRepositoriesResponse = type({
	repositories: repositorySchema.array(),
});
export type ListRepositoriesResponseDto = typeof listRepositoriesResponse.infer;

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
	config: repositoryConfigSchema,
	"compressionMode?": type.enumerated("off", "auto", "fastest", "better", "max"),
});

export type CreateRepositoryBody = typeof createRepositoryBody.infer;

export const createRepositoryResponse = type({
	message: "string",
	repository: type({
		id: "string",
		name: "string",
	}),
});

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
export const getRepositoryResponse = type({
	repository: repositorySchema,
});
export type GetRepositoryResponseDto = typeof getRepositoryResponse.infer;

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
