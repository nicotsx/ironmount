import "dotenv/config";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "./schema";
import { DATABASE_URL } from "../core/constants";

const sqlite = new Database(DATABASE_URL);

export const db = drizzle({ client: sqlite, schema });

export const runDbMigrations = () => {
	migrate(db, { migrationsFolder: "./drizzle" });
};
