import { type } from "arktype";
import "dotenv/config";

const envSchema = type({
	NODE_ENV: type
		.enumerated("development", "production", "test")
		.default("development"),
	DB_FILE_NAME: "string",
}).pipe((s) => ({
	__prod__: s.NODE_ENV === "production",
	environment: s.NODE_ENV,
	dbFileName: s.DB_FILE_NAME,
}));

const parseConfig = (env: unknown) => {
	const result = envSchema(env);

	if (result instanceof type.errors) {
		throw new Error(`Invalid environment variables: ${result.toString()}`);
	}

	return result;
};

export const config = parseConfig(process.env);
