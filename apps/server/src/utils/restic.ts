import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { type } from "arktype";
import { $ } from "bun";
import { RESTIC_PASS_FILE } from "../core/constants";
import { logger } from "./logger";

const backupOutputSchema = type({
	message_type: "'summary'",
	files_new: "number",
	files_changed: "number",
	files_unmodified: "number",
	dirs_new: "number",
	dirs_changed: "number",
	dirs_unmodified: "number",
	data_blobs: "number",
	tree_blobs: "number",
	data_added: "number",
	total_files_processed: "number",
	total_bytes_processed: "number",
	total_duration: "number",
	snapshot_id: "string",
});

const ensurePassfile = async () => {
	await fs.mkdir(path.dirname(RESTIC_PASS_FILE), { recursive: true });

	try {
		await fs.access(RESTIC_PASS_FILE);
	} catch {
		logger.info("Restic passfile not found, creating a new one...");
		await fs.writeFile(RESTIC_PASS_FILE, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
	}
};

const init = async (name: string) => {
	const res =
		await $`restic init --repo /data/repositories/${name} --password-file /data/secrets/restic.pass --json`.nothrow();
};

const backup = async (repo: string, source: string) => {
	const res =
		await $`restic --repo /data/repositories/${repo} backup ${source} --password-file /data/secrets/restic.pass --json`.nothrow();

	if (res.exitCode !== 0) {
		logger.error(`Restic backup failed: ${res.stderr}`);
		throw new Error(`Restic backup failed: ${res.stderr}`);
	}

	const result = backupOutputSchema(res.json());

	if (result instanceof type.errors) {
		logger.error(`Restic backup output validation failed: ${result}`);
		throw new Error(`Restic backup output validation failed: ${result}`);
	}

	return result;
};

export const restic = {
	ensurePassfile,
	init,
	backup,
};
