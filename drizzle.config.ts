import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./app/drizzle",
	schema: "./app/server/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: "./data/zerobyte.db",
	},
});
