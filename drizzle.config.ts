import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./apps/server/drizzle",
	schema: "./apps/server/src/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: "./data/ironmount.db",
	},
});
