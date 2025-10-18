import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { RepositoryConfig } from "@ironmount/schemas";
import { type } from "arktype";
import { $ } from "bun";
import { RESTIC_PASS_FILE } from "../core/constants";
import { logger } from "./logger";
import { cryptoUtils } from "./crypto";

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

const buildRepoUrl = (config: RepositoryConfig): string => {
	switch (config.backend) {
		case "s3":
			return `s3:${config.endpoint}/${config.bucket}`;
		default: {
			throw new Error(`Unsupported repository backend: ${JSON.stringify(config)}`);
		}
	}
};

const buildEnv = async (config: RepositoryConfig) => {
	const env: Record<string, string> = {};

	switch (config.backend) {
		case "s3":
			env.AWS_ACCESS_KEY_ID = await cryptoUtils.decrypt(config.accessKeyId);
			env.AWS_SECRET_ACCESS_KEY = await cryptoUtils.decrypt(config.secretAccessKey);
			break;
	}

	return env;
};

const init = async (config: RepositoryConfig) => {
	await ensurePassfile();

	const repoUrl = buildRepoUrl(config);
	const env = await buildEnv(config);

	const res = await $`restic init --repo ${repoUrl} --password-file ${RESTIC_PASS_FILE} --json`.env(env).nothrow();

	if (res.exitCode !== 0) {
		logger.error(`Restic init failed: ${res.stderr}`);
		return { success: false, error: res.stderr };
	}

	logger.info(`Restic repository initialized: ${repoUrl}`);
	return { success: true, error: null };
};

const backup = async (config: RepositoryConfig, source: string) => {
	const repoUrl = buildRepoUrl(config);
	const env = await buildEnv(config);

	const res = await $`restic --repo ${repoUrl} backup ${source} --password-file /data/secrets/restic.pass --json`
		.env(env)
		.nothrow();

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
