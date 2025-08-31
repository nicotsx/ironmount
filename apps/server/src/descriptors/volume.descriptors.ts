import { type } from "arktype";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/arktype";

export const listVolumesResponse = type({
	volumes: type({
		name: "string",
		mountpoint: "string",
		createdAt: "string",
	}).array(),
});

export const listVolumesDescriptor = describeRoute({
	description: "List all volumes",
	tags: ["Volumes"],
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
