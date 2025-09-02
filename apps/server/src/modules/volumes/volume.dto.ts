import { volumeConfigSchema } from "@ironmount/schemas";
import { type } from "arktype";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/arktype";

/**
 * List all volumes
 */
export const listVolumesResponse = type({
	volumes: type({
		name: "string",
		path: "string",
		createdAt: "number",
	}).array(),
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
