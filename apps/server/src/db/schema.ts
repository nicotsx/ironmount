import type { BackendStatus, BackendType, volumeConfigSchema } from "@ironmount/schemas";
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const volumesTable = sqliteTable("volumes_table", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull().unique(),
	path: text().notNull(),
	type: text().$type<BackendType>().notNull(),
	status: text().$type<BackendStatus>().notNull().default("unmounted"),
	lastError: text("last_error"),
	lastHealthCheck: int("last_health_check", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	createdAt: int("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: int("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	config: text("config", { mode: "json" }).$type<typeof volumeConfigSchema.inferOut>().notNull(),
	autoRemount: int("auto_remount").notNull().default(1),
});

export type Volume = typeof volumesTable.$inferSelect;
