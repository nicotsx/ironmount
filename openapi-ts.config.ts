import { defaultPlugins, defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "http://192.168.2.42:4096/api/v1/openapi.json",
	output: {
		path: "./app/client/api-client",
		format: "biome",
	},
	plugins: [...defaultPlugins, "@tanstack/react-query", "@hey-api/client-fetch"],
});
