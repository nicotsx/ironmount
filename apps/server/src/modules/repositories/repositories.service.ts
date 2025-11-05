import crypto from "node:crypto";
import type { CompressionMode, RepositoryConfig } from "@ironmount/schemas/restic";
import { eq } from "drizzle-orm";
import { ConflictError, InternalServerError, NotFoundError } from "http-errors-enhanced";
import slugify from "slugify";
import { db } from "../../db/db";
import { repositoriesTable, volumesTable } from "../../db/schema";
import { toMessage } from "../../utils/errors";
import { restic } from "../../utils/restic";
import { cryptoUtils } from "../../utils/crypto";

const listRepositories = async () => {
	const repositories = await db.query.repositoriesTable.findMany({});
	return repositories;
};

const encryptConfig = async (config: RepositoryConfig): Promise<RepositoryConfig> => {
	const encryptedConfig: Record<string, string> = { ...config };

	switch (config.backend) {
		case "s3":
			encryptedConfig.accessKeyId = await cryptoUtils.encrypt(config.accessKeyId);
			encryptedConfig.secretAccessKey = await cryptoUtils.encrypt(config.secretAccessKey);
			break;
	}

	return encryptedConfig as RepositoryConfig;
};

const createRepository = async (name: string, config: RepositoryConfig, compressionMode?: CompressionMode) => {
	const slug = slugify(name, { lower: true, strict: true });

	const existing = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.name, slug),
	});

	if (existing) {
		throw new ConflictError("Repository with this name already exists");
	}

	const id = crypto.randomUUID();

	const encryptedConfig = await encryptConfig(config);

	const [created] = await db
		.insert(repositoriesTable)
		.values({
			id,
			name: slug,
			type: config.backend,
			config: encryptedConfig,
			compressionMode: compressionMode ?? "auto",
			status: "unknown",
		})
		.returning();

	if (!created) {
		throw new InternalServerError("Failed to create repository");
	}

	const { success, error } = await restic.init(encryptedConfig);

	if (success) {
		await db
			.update(repositoriesTable)
			.set({
				status: "healthy",
				lastChecked: Date.now(),
				lastError: null,
			})
			.where(eq(repositoriesTable.id, id));

		return { repository: created, status: 201 };
	}

	const errorMessage = toMessage(error);
	await db.delete(repositoriesTable).where(eq(repositoriesTable.id, id));

	throw new InternalServerError(`Failed to initialize repository: ${errorMessage}`);
};

const getRepository = async (name: string) => {
	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.name, name),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	return { repository };
};

const deleteRepository = async (name: string) => {
	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.name, name),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	// TODO: Add cleanup logic for the actual restic repository files

	await db.delete(repositoriesTable).where(eq(repositoriesTable.name, name));
};

/**
 * List snapshots for a given repository
 * If backupId is provided, filter snapshots by that backup ID (tag)
 * @param name Repository name
 * @param backupId Optional backup ID to filter snapshots for a specific backup schedule
 *
 * @returns List of snapshots
 */
const listSnapshots = async (name: string, backupId?: string) => {
	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.name, name),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	let snapshots = [];

	if (backupId) {
		snapshots = await restic.snapshots(repository.config, { tags: [backupId.toString()] });
	} else {
		snapshots = await restic.snapshots(repository.config);
	}

	return snapshots;
};

const listSnapshotFiles = async (name: string, snapshotId: string, path?: string) => {
	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.name, name),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	const result = await restic.ls(repository.config, snapshotId, path);

	if (!result.snapshot) {
		throw new NotFoundError("Snapshot not found or empty");
	}

	return {
		snapshot: {
			id: result.snapshot.id,
			short_id: result.snapshot.short_id,
			time: result.snapshot.time,
			hostname: result.snapshot.hostname,
			paths: result.snapshot.paths,
		},
		files: result.nodes,
	};
};

const restoreSnapshot = async (
	name: string,
	snapshotId: string,
	options?: { include?: string[]; exclude?: string[]; delete?: boolean },
) => {
	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.name, name),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	const result = await restic.restore(repository.config, snapshotId, "/", options);

	return {
		success: true,
		message: "Snapshot restored successfully",
		filesRestored: result.files_restored,
		filesSkipped: result.files_skipped,
	};
};

const getSnapshotDetails = async (name: string, snapshotId: string) => {
	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.name, name),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	const snapshots = await restic.snapshots(repository.config);
	const snapshot = snapshots.find((snap) => snap.id === snapshotId || snap.short_id === snapshotId);

	if (!snapshot) {
		throw new NotFoundError("Snapshot not found");
	}

	return snapshot;
};

export const repositoriesService = {
	listRepositories,
	createRepository,
	getRepository,
	deleteRepository,
	listSnapshots,
	listSnapshotFiles,
	restoreSnapshot,
	getSnapshotDetails,
};
