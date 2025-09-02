import type { volumeConfigSchema } from "@ironmount/schemas";
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const volumesTable = sqliteTable("volumes_table", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull().unique(),
	path: text().notNull(),
	type: text().notNull(),
	createdAt: int("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: int("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	config: text("config", { mode: "json" }).$type<typeof volumeConfigSchema.inferOut>().notNull(),
});

export type Volume = typeof volumesTable.$inferSelect;
