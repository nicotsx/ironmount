import { volumeConfigSchemaNoUndefined } from "@ironmount/schemas";
import { type } from "arktype";
import { describeRoute, resolver } from "hono-openapi";

const volumeSchema = type({
	name: "string",
	path: "string",
	type: type.enumerated("nfs", "smb", "directory", "webdav"),
	status: type.enumerated("mounted", "unmounted", "error", "unknown"),
	lastError: "string | null",
	createdAt: "number",
	updatedAt: "number",
	lastHealthCheck: "number",
	config: volumeConfigSchemaNoUndefined,
	autoRemount: "boolean",
});

export type VolumeDto = typeof volumeSchema.infer;

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
	config: volumeConfigSchemaNoUndefined,
});

export const createVolumeResponse = type({
	message: "string",
	volume: type({
		name: "string",
		path: "string",
	}),
});

export const createVolumeDto = describeRoute({
	description: "Create a new volume",
	operationId: "createVolume",
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

const statfsSchema = type({
	total: "number",
	used: "number",
	free: "number",
});

const getVolumeResponse = type({
	volume: volumeSchema,
	statfs: statfsSchema,
});

export type GetVolumeResponseDto = typeof getVolumeResponse.infer;
/**
 * Get a volume
 */
export const getVolumeDto = describeRoute({
	description: "Get a volume by name",
	operationId: "getVolume",
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Volume details",
			content: {
				"application/json": {
					schema: resolver(getVolumeResponse),
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
	autoRemount: "boolean?",
	config: volumeConfigSchemaNoUndefined.optional(),
});

export type UpdateVolumeBody = typeof updateVolumeBody.infer;

export const updateVolumeResponse = type({
	message: "string",
	volume: volumeSchema,
});

export const updateVolumeDto = describeRoute({
	description: "Update a volume's configuration",
	operationId: "updateVolume",
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

export type UpdateVolumeResponseDto = typeof updateVolumeResponse.infer;

/**
 * Test connection
 */
export const testConnectionBody = type({
	config: volumeConfigSchemaNoUndefined,
});

export const testConnectionResponse = type({
	success: "boolean",
	message: "string",
});

export const testConnectionDto = describeRoute({
	description: "Test connection to backend",
	operationId: "testConnection",
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

/**
 * Mount volume
 */
export const mountVolumeResponse = type({
	error: "string?",
	status: type.enumerated("mounted", "unmounted", "error"),
});

export const mountVolumeDto = describeRoute({
	description: "Mount a volume",
	operationId: "mountVolume",
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Volume mounted successfully",
			content: {
				"application/json": {
					schema: resolver(mountVolumeResponse),
				},
			},
		},
		404: {
			description: "Volume not found",
		},
	},
});

/**
 * Unmount volume
 */
export const unmountVolumeResponse = type({
	error: "string?",
	status: type.enumerated("mounted", "unmounted", "error"),
});

export const unmountVolumeDto = describeRoute({
	description: "Unmount a volume",
	operationId: "unmountVolume",
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Volume unmounted successfully",
			content: {
				"application/json": {
					schema: resolver(unmountVolumeResponse),
				},
			},
		},
		404: {
			description: "Volume not found",
		},
	},
});

export const healthCheckResponse = type({
	error: "string?",
	status: type.enumerated("mounted", "unmounted", "error"),
});

export const healthCheckDto = describeRoute({
	description: "Perform a health check on a volume",
	operationId: "healthCheckVolume",
	tags: ["Volumes"],
	responses: {
		200: {
			description: "Volume health check result",
			content: {
				"application/json": {
					schema: resolver(healthCheckResponse),
				},
			},
		},
		404: {
			description: "Volume not found",
		},
	},
});

/**
 * Get containers using a volume
 */
const containerSchema = type({
	id: "string",
	name: "string",
	state: "string",
	image: "string",
});

export const listContainersResponse = type({
	containers: containerSchema.array(),
});
export type ListContainersResponseDto = typeof listContainersResponse.infer;

export const getContainersDto = describeRoute({
	description: "Get containers using a volume by name",
	operationId: "getContainersUsingVolume",
	tags: ["Volumes"],
	responses: {
		200: {
			description: "List of containers using the volume",
			content: {
				"application/json": {
					schema: resolver(listContainersResponse),
				},
			},
		},
		404: {
			description: "Volume not found",
		},
	},
});
