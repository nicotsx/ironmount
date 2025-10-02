import { type } from "arktype";
import "dotenv/config";

const envSchema = type({
	NODE_ENV: type.enumerated("development", "production", "test").default("development"),
	SESSION_SECRET: "string?",
}).pipe((s) => ({
	__prod__: s.NODE_ENV === "production",
	environment: s.NODE_ENV,
	sessionSecret: s.SESSION_SECRET || "change-me-in-production-please",
}));

const parseConfig = (env: unknown) => {
	const result = envSchema(env);

	if (result instanceof type.errors) {
		throw new Error(`Invalid environment variables: ${result.toString()}`);
	}

	return result;
};

export const config = parseConfig(process.env);
