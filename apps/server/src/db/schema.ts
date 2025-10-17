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
	autoRemount: int("auto_remount", { mode: "boolean" }).notNull().default(true),
});

export type Volume = typeof volumesTable.$inferSelect;

export const usersTable = sqliteTable("users_table", {
	id: int().primaryKey({ autoIncrement: true }),
	username: text().notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: int("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: int("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type User = typeof usersTable.$inferSelect;

export const sessionsTable = sqliteTable("sessions_table", {
	id: text().primaryKey(),
	userId: int("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	expiresAt: int("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: int("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Session = typeof sessionsTable.$inferSelect;

export const repositoriesTable = sqliteTable("repositories_table", {
	id: text().primaryKey(),
});
