import { type } from "arktype";
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

const BACKEND_TYPES = {
	nfs: "nfs",
	smb: "smb",
	directory: "directory",
};
export type BackendType = keyof typeof BACKEND_TYPES;

const nfsConfigSchema = type({
	backend: "'nfs'",
	server: "string",
	exportPath: "string",
	port: "number",
	version: "string", // Shold be an enum: "3" | "4" | "4.1"
});

const smbConfigSchema = type({
	backend: "'smb'",
});

const directoryConfigSchema = type({
	backend: "'directory'",
});

export const volumeConfigSchema = nfsConfigSchema
	.or(smbConfigSchema)
	.or(directoryConfigSchema);

export type BackendConfig = typeof volumeConfigSchema.infer;

export const volumesTable = sqliteTable("volumes_table", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull().unique(),
	path: text().notNull(),
	type: text().notNull(),
	createdAt: int("created_at").notNull().default(sql`(current_timestamp)`),
	updatedAt: int("updated_at").notNull().default(sql`(current_timestamp)`),
	config: text("config", { mode: "json" })
		.$type<typeof volumeConfigSchema.inferOut>()
		.notNull(),
});

export type Volume = typeof volumesTable.$inferSelect;
