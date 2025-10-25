import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { RepositoryConfig } from "@ironmount/schemas/restic";
import { type } from "arktype";
import { $ } from "bun";
import { RESTIC_PASS_FILE } from "../core/constants";
import { logger } from "./logger";
import { cryptoUtils } from "./crypto";
import type { RetentionPolicy } from "../modules/backups/backups.dto";

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

const snapshotInfoSchema = type({
	gid: "number?",
	hostname: "string",
	id: "string",
	parent: "string?",
	paths: "string[]",
	program_version: "string?",
	short_id: "string",
	time: "string",
	uid: "number?",
	username: "string",
	summary: type({
		backup_end: "string",
		backup_start: "string",
		data_added: "number",
		data_added_packed: "number",
		data_blobs: "number",
		dirs_changed: "number",
		dirs_new: "number",
		dirs_unmodified: "number",
		files_changed: "number",
		files_new: "number",
		files_unmodified: "number",
		total_bytes_processed: "number",
		total_files_processed: "number",
		tree_blobs: "number",
	}).optional(),
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
		case "local":
			return config.path;
		case "s3":
			return `s3:${config.endpoint}/${config.bucket}`;
		default: {
			throw new Error(`Unsupported repository backend: ${JSON.stringify(config)}`);
		}
	}
};

const buildEnv = async (config: RepositoryConfig) => {
	const env: Record<string, string> = {
		RESTIC_CACHE_DIR: "/tmp/restic-cache",
		RESTIC_PASSWORD_FILE: RESTIC_PASS_FILE,
	};

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

	const res = await $`restic init --repo ${repoUrl} --json`.env(env).nothrow();

	if (res.exitCode !== 0) {
		logger.error(`Restic init failed: ${res.stderr}`);
		return { success: false, error: res.stderr };
	}

	logger.info(`Restic repository initialized: ${repoUrl}`);
	return { success: true, error: null };
};

const backup = async (
	config: RepositoryConfig,
	source: string,
	options?: { exclude?: string[]; include?: string[] },
) => {
	const repoUrl = buildRepoUrl(config);
	const env = await buildEnv(config);

	const args: string[] = ["--repo", repoUrl, "backup", source];

	if (options?.exclude && options.exclude.length > 0) {
		for (const pattern of options.exclude) {
			args.push("--exclude", pattern);
		}
	}

	if (options?.include && options.include.length > 0) {
		for (const pattern of options.include) {
			args.push("--include", pattern);
		}
	}

	args.push("--json");

	const res = await $`restic ${args}`.env(env).nothrow();

	if (res.exitCode !== 0) {
		logger.error(`Restic backup failed: ${res.stderr}`);
		throw new Error(`Restic backup failed: ${res.stderr}`);
	}

	// res is a succession of JSON objects, we need to parse the last one which contains the summary
	const stdout = res.text();
	const outputLines = stdout.trim().split("\n");
	const lastLine = outputLines[outputLines.length - 1];
	const resSummary = JSON.parse(lastLine ?? "{}");

	const result = backupOutputSchema(resSummary);

	if (result instanceof type.errors) {
		logger.error(`Restic backup output validation failed: ${result}`);
		throw new Error(`Restic backup output validation failed: ${result}`);
	}

	return result;
};

const restore = async (config: RepositoryConfig, snapshotId: string, target: string) => {
	const repoUrl = buildRepoUrl(config);
	const env = await buildEnv(config);

	const res = await $`restic --repo ${repoUrl} restore ${snapshotId} --target ${target} --json`.env(env).nothrow();

	if (res.exitCode !== 0) {
		logger.error(`Restic restore failed: ${res.stderr}`);
		throw new Error(`Restic restore failed: ${res.stderr}`);
	}

	logger.info(`Restic restore completed for snapshot ${snapshotId} to target ${target}`);
};

const snapshots = async (config: RepositoryConfig) => {
	const repoUrl = buildRepoUrl(config);
	const env = await buildEnv(config);

	const res = await $`restic --repo ${repoUrl} snapshots --json`.env(env).nothrow();

	if (res.exitCode !== 0) {
		logger.error(`Restic snapshots retrieval failed: ${res.stderr}`);
		throw new Error(`Restic snapshots retrieval failed: ${res.stderr}`);
	}

	const result = snapshotInfoSchema.array()(res.json());

	if (result instanceof type.errors) {
		logger.error(`Restic snapshots output validation failed: ${result}`);
		throw new Error(`Restic snapshots output validation failed: ${result}`);
	}

	return result;
};

const forget = async (config: RepositoryConfig, options: RetentionPolicy) => {
	const repoUrl = buildRepoUrl(config);
	const env = await buildEnv(config);

	const args: string[] = ["--repo", repoUrl, "forget"];

	if (options.keepLast) {
		args.push("--keep-last", String(options.keepLast));
	}
	if (options.keepHourly) {
		args.push("--keep-hourly", String(options.keepHourly));
	}
	if (options.keepDaily) {
		args.push("--keep-daily", String(options.keepDaily));
	}
	if (options.keepWeekly) {
		args.push("--keep-weekly", String(options.keepWeekly));
	}
	if (options.keepMonthly) {
		args.push("--keep-monthly", String(options.keepMonthly));
	}
	if (options.keepYearly) {
		args.push("--keep-yearly", String(options.keepYearly));
	}
	if (options.keepWithinDuration) {
		args.push("--keep-within-duration", options.keepWithinDuration);
	}

	args.push("--prune");
	args.push("--json");

	const res = await $`restic ${args}`.env(env).nothrow();

	if (res.exitCode !== 0) {
		logger.error(`Restic forget failed: ${res.stderr}`);
		throw new Error(`Restic forget failed: ${res.stderr}`);
	}

	logger.info("Restic forget completed successfully");
	return { success: true };
};

export const restic = {
	ensurePassfile,
	init,
	backup,
	restore,
	snapshots,
	forget,
};
