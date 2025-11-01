import "dotenv/config";
import { Database } from "bun:sqlite";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { DATABASE_URL } from "../core/constants";
import * as schema from "./schema";

const sqlite = new Database(DATABASE_URL);
sqlite.run("PRAGMA foreign_keys = ON;");

export const db = drizzle({ client: sqlite, schema });

export const runDbMigrations = () => {
	let migrationsFolder = path.join("/app", "assets", "migrations");

	const { NODE_ENV } = process.env;
	if (NODE_ENV !== "production") {
		migrationsFolder = path.join("/app", "apps", "server", "drizzle");
	}

	migrate(db, { migrationsFolder });
};
