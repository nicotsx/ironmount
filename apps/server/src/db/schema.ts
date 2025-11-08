import type { BackendStatus, BackendType, volumeConfigSchema } from "@ironmount/schemas";
import type {
	CompressionMode,
	RepositoryBackend,
	repositoryConfigSchema,
	RepositoryStatus,
} from "@ironmount/schemas/restic";
import { relations, sql } from "drizzle-orm";
import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Volumes Table
 */
export const volumesTable = sqliteTable("volumes_table", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull().unique(),
	type: text().$type<BackendType>().notNull(),
	status: text().$type<BackendStatus>().notNull().default("unmounted"),
	lastError: text("last_error"),
	lastHealthCheck: integer("last_health_check", { mode: "number" }).notNull().default(sql`(unixepoch())`),
	createdAt: integer("created_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
	config: text("config", { mode: "json" }).$type<typeof volumeConfigSchema.inferOut>().notNull(),
	autoRemount: int("auto_remount", { mode: "boolean" }).notNull().default(true),
});
export type Volume = typeof volumesTable.$inferSelect;

/**
 * Users Table
 */
export const usersTable = sqliteTable("users_table", {
	id: int().primaryKey({ autoIncrement: true }),
	username: text().notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	createdAt: int("created_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
	updatedAt: int("updated_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
});
export type User = typeof usersTable.$inferSelect;
export const sessionsTable = sqliteTable("sessions_table", {
	id: text().primaryKey(),
	userId: int("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	expiresAt: int("expires_at", { mode: "number" }).notNull(),
	createdAt: int("created_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
});
export type Session = typeof sessionsTable.$inferSelect;

/**
 * Repositories Table
 */
export const repositoriesTable = sqliteTable("repositories_table", {
	id: text().primaryKey(),
	name: text().notNull().unique(),
	type: text().$type<RepositoryBackend>().notNull(),
	config: text("config", { mode: "json" }).$type<typeof repositoryConfigSchema.inferOut>().notNull(),
	compressionMode: text("compression_mode").$type<CompressionMode>().default("auto"),
	status: text().$type<RepositoryStatus>().default("unknown"),
	lastChecked: int("last_checked", { mode: "number" }),
	lastError: text("last_error"),
	createdAt: int("created_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
	updatedAt: int("updated_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
});
export type Repository = typeof repositoriesTable.$inferSelect;

/**
 * Backup Schedules Table
 */
export const backupSchedulesTable = sqliteTable("backup_schedules_table", {
	id: int().primaryKey({ autoIncrement: true }),
	volumeId: int("volume_id")
		.notNull()
		.references(() => volumesTable.id, { onDelete: "cascade" }),
	repositoryId: text("repository_id")
		.notNull()
		.references(() => repositoriesTable.id, { onDelete: "cascade" }),
	enabled: int("enabled", { mode: "boolean" }).notNull().default(true),
	cronExpression: text("cron_expression").notNull(),
	retentionPolicy: text("retention_policy", { mode: "json" }).$type<{
		keepLast?: number;
		keepHourly?: number;
		keepDaily?: number;
		keepWeekly?: number;
		keepMonthly?: number;
		keepYearly?: number;
		keepWithinDuration?: string;
	}>(),
	excludePatterns: text("exclude_patterns", { mode: "json" }).$type<string[]>().default([]),
	includePatterns: text("include_patterns", { mode: "json" }).$type<string[]>().default([]),
	lastBackupAt: int("last_backup_at", { mode: "number" }),
	lastBackupStatus: text("last_backup_status").$type<"success" | "error" | "in_progress">(),
	lastBackupError: text("last_backup_error"),
	nextBackupAt: int("next_backup_at", { mode: "number" }),
	createdAt: int("created_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
	updatedAt: int("updated_at", { mode: "number" }).notNull().default(sql`(unixepoch())`),
});
export const backupScheduleRelations = relations(backupSchedulesTable, ({ one }) => ({
	volume: one(volumesTable, {
		fields: [backupSchedulesTable.volumeId],
		references: [volumesTable.id],
	}),
	repository: one(repositoriesTable, {
		fields: [backupSchedulesTable.repositoryId],
		references: [repositoriesTable.id],
	}),
}));
export type BackupSchedule = typeof backupSchedulesTable.$inferSelect;
