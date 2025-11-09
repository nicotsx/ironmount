import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const alias = {};

const { NODE_ENV } = process.env;
if (NODE_ENV === "production") {
	// @ts-expect-error
	alias["react-dom/server"] = "react-dom/server.node";
}

export default defineConfig({
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
	resolve: {
		alias,
	},
	build: {
		outDir: "dist",
		// sourcemap: true,
	},
	server: {
		host: true,
		port: 4097,
		proxy: {
			"/api": {
				target: "http://localhost:4096",
				changeOrigin: true,
			},
		},
		allowedHosts: true,
	},
});
