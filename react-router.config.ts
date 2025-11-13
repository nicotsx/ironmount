import type { Config } from "@react-router/dev/config";

export default {
	buildDirectory: "dist",
	ssr: true,
	future: {
		v8_middleware: true,
	},
} satisfies Config;
