import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "http://192.168.2.42:3000/api/v1/openapi.json",
	output: {
		path: "./apps/client/app/api-client",
		format: "biome",
	},
	plugins: [
		...defaultPlugins,
		"@tanstack/react-query",
		"@hey-api/client-fetch",
	],
});
