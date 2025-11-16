import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { reactRouterHonoServer } from "react-router-hono-server/dev";

const getVersion = () => {
	return process.env.VITE_APP_VERSION || "dev";
};

export default defineConfig({
	plugins: [reactRouterHonoServer({ runtime: "bun" }), reactRouter(), tailwindcss(), tsconfigPaths()],
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(getVersion()),
	},
	build: {
		outDir: "dist",
		sourcemap: true,
		rollupOptions: {
			external: ["bun"],
		},
	},
	server: {
		host: true,
		port: 4096,
	},
});
