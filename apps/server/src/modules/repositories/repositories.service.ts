import crypto from "node:crypto";
import type { CompressionMode, RepositoryConfig } from "@ironmount/schemas";
import { eq } from "drizzle-orm";
import { ConflictError, InternalServerError, NotFoundError } from "http-errors-enhanced";
import slugify from "slugify";
import { db } from "../../db/db";
import { repositoriesTable } from "../../db/schema";
import { toMessage } from "../../utils/errors";
import { restic } from "../../utils/restic";

const listRepositories = async () => {
	const repositories = await db.query.repositoriesTable.findMany({});
	return repositories;
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

	const [created] = await db
		.insert(repositoriesTable)
		.values({
			id,
			name: slug,
			backend: config.backend,
			config,
			compressionMode: compressionMode ?? "auto",
			status: "unknown",
		})
		.returning();

	if (!created) {
		throw new InternalServerError("Failed to create repository");
	}

	const { success, error } = await restic.init(config);

	if (success) {
		await db
			.update(repositoriesTable)
			.set({
				status: "healthy",
				lastChecked: new Date(),
				lastError: null,
			})
			.where(eq(repositoriesTable.id, id));

		return { repository: created, status: 201 };
	}

	const errorMessage = toMessage(error);
	await db
		.update(repositoriesTable)
		.set({
			status: "error",
			lastError: errorMessage,
			lastChecked: new Date(),
		})
		.where(eq(repositoriesTable.id, id));

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

export const repositoriesService = {
	listRepositories,
	createRepository,
	getRepository,
	deleteRepository,
};
