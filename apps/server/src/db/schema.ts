import { type } from "arktype";
import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

const nfsConfigSchema = type({
	backend: "'nfs'",
	server: "string",
	exportPath: "string",
	port: "number",
	version: type.enumerated(["3", "4"]),
});

const smbConfigSchema = type({
	backend: "'smb'",
});

const directoryConfigSchema = type({
	backend: "'directory'",
});

const configSchema = nfsConfigSchema
	.or(smbConfigSchema)
	.or(directoryConfigSchema);

export const volumesTable = sqliteTable("volumes_table", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull().unique(),
	path: text().notNull(),
	type: text().notNull(),
	createdAt: int("created_at").notNull().default(sql`(current_timestamp)`),
	updatedAt: int("updated_at").notNull().default(sql`(current_timestamp)`),
	config: text("config", { mode: "json" })
		.$type<typeof configSchema.inferOut>()
		.notNull(),
});
