import "dotenv/config";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { config } from "../core/config";
import * as schema from "./schema";

const sqlite = new Database(config.dbFileName);

export const db = drizzle({ client: sqlite, schema });

export const runDbMigrations = () => {
	migrate(db, { migrationsFolder: "./drizzle" });
};
