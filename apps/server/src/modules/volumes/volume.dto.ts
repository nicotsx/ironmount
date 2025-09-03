import { volumeConfigSchema } from "@ironmount/schemas";
import { type } from "arktype";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/arktype";

const volumeSchema = type({
	name: "string",
	path: "string",
	type: type.enumerated("nfs", "smb", "directory"),
	createdAt: "number",
	updatedAt: "number",
	config: volumeConfigSchema,
});

/**
 * List all volumes
 */
export const listVolumesResponse = type({
	volumes: volumeSchema.array(),
});
export type ListVolumesResponseDto = typeof listVolumesResponse.infer;

export const listVolumesDto = describeRoute({
	description: "List all volumes",
	tags: ["Volumes"],
	operationId: "listVolumes",
	validateResponse: true,
	responses: {
		200: {
			description: "A list of volumes",
			content: {
				"application/json": {
					schema: resolver(listVolumesResponse),
				},
			},
		},
	},
});

/**
 * Create a new volume
 */
export const createVolumeBody = type({
	name: "string",
	config: volumeConfigSchema,
});

export const createVolumeResponse = type({
	message: "string",
	volume: type({
		name: "string",
		path: "string",
		createdAt: "number",
	}),
});

export const createVolumeDto = describeRoute({
	description: "Create a new volume",
	operationId: "createVolume",
	validateResponse: true,
	tags: ["Volumes"],
	responses: {
		201: {
			description: "Volume created successfully",
			content: {
				"application/json": {
					schema: resolver(createVolumeResponse),
				},
			},
		},
	},
});

/**
 * Delete a volume
 */
export const deleteVolumeResponse = type({
	message: "string",
});

export const deleteVolumeDto = describeRoute({
	description: "Delete a volume",
	operationId: "deleteVolume",
	validateResponse: true,
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Volume deleted successfully",
			content: {
				"application/json": {
					schema: resolver(deleteVolumeResponse),
				},
			},
		},
	},
});

/**
 * Get a volume
 */
export const getVolumeDto = describeRoute({
	description: "Get a volume by name",
	operationId: "getVolume",
	validateResponse: true,
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Volume details",
			content: {
				"application/json": {
					schema: resolver(volumeSchema),
				},
			},
		},
		404: {
			description: "Volume not found",
		},
	},
});

/**
 * Update a volume
 */
export const updateVolumeBody = type({
	config: volumeConfigSchema,
});

export const updateVolumeResponse = type({
	message: "string",
	volume: type({
		name: "string",
		path: "string",
		type: "string",
		createdAt: "number",
		updatedAt: "number",
		config: volumeConfigSchema,
	}),
});

export const updateVolumeDto = describeRoute({
	description: "Update a volume's configuration",
	operationId: "updateVolume",
	validateResponse: true,
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Volume updated successfully",
			content: {
				"application/json": {
					schema: resolver(updateVolumeResponse),
				},
			},
		},
		404: {
			description: "Volume not found",
		},
	},
});

/**
 * Test connection
 */
export const testConnectionBody = type({
	config: volumeConfigSchema,
});

export const testConnectionResponse = type({
	success: "boolean",
	message: "string",
});

export const testConnectionDto = describeRoute({
	description: "Test connection to backend",
	operationId: "testConnection",
	validateResponse: true,
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Connection test result",
			content: {
				"application/json": {
					schema: resolver(testConnectionResponse),
				},
			},
		},
	},
});
