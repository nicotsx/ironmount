import type { Config } from "@react-router/dev/config";

export default {
	ssr: false,
	buildDirectory: "dist",
	future: {
		v8_middleware: true,
	},
} satisfies Config;
