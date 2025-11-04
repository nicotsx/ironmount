import { Hono } from "hono";
import { validator } from "hono-openapi";
import {
	createRepositoryBody,
	createRepositoryDto,
	deleteRepositoryDto,
	getRepositoryDto,
	getSnapshotDetailsDto,
	listRepositoriesDto,
	listSnapshotFilesDto,
	listSnapshotFilesQuery,
	listSnapshotsDto,
	listSnapshotsFilters,
	restoreSnapshotBody,
	restoreSnapshotDto,
	type DeleteRepositoryDto,
	type GetRepositoryDto,
	type GetSnapshotDetailsDto,
	type ListRepositoriesDto,
	type ListSnapshotFilesDto,
	type ListSnapshotsDto,
	type RestoreSnapshotDto,
} from "./repositories.dto";
import { repositoriesService } from "./repositories.service";

export const repositoriesController = new Hono()
	.get("/", listRepositoriesDto, async (c) => {
		const repositories = await repositoriesService.listRepositories();

		return c.json<ListRepositoriesDto>(repositories, 200);
	})
	.post("/", createRepositoryDto, validator("json", createRepositoryBody), async (c) => {
		const body = c.req.valid("json");
		const res = await repositoriesService.createRepository(body.name, body.config, body.compressionMode);

		return c.json({ message: "Repository created", repository: res.repository }, 201);
	})
	.get("/:name", getRepositoryDto, async (c) => {
		const { name } = c.req.param();
		const res = await repositoriesService.getRepository(name);

		return c.json<GetRepositoryDto>(res.repository, 200);
	})
	.delete("/:name", deleteRepositoryDto, async (c) => {
		const { name } = c.req.param();
		await repositoriesService.deleteRepository(name);

		return c.json<DeleteRepositoryDto>({ message: "Repository deleted" }, 200);
	})
	.get("/:name/snapshots", listSnapshotsDto, validator("query", listSnapshotsFilters), async (c) => {
		const { name } = c.req.param();
		const { volumeId } = c.req.valid("query");

		const res = await repositoriesService.listSnapshots(name, Number(volumeId));

		const snapshots = res.map((snapshot) => {
			const { summary } = snapshot;

			let duration = 0;
			if (summary) {
				const { backup_start, backup_end } = summary;
				duration = new Date(backup_end).getTime() - new Date(backup_start).getTime();
			}

			return {
				short_id: snapshot.short_id,
				duration,
				paths: snapshot.paths,
				size: summary?.total_bytes_processed || 0,
				time: new Date(snapshot.time).getTime(),
			};
		});

		return c.json<ListSnapshotsDto>(snapshots, 200);
	})
	.get("/:name/snapshots/:snapshotId", getSnapshotDetailsDto, async (c) => {
		const { name, snapshotId } = c.req.param();
		const snapshot = await repositoriesService.getSnapshotDetails(name, snapshotId);

		let duration = 0;
		if (snapshot.summary) {
			const { backup_start, backup_end } = snapshot.summary;
			duration = new Date(backup_end).getTime() - new Date(backup_start).getTime();
		}

		const response = {
			short_id: snapshot.short_id,
			duration,
			time: new Date(snapshot.time).getTime(),
			paths: snapshot.paths,
			size: snapshot.summary?.total_bytes_processed || 0,
			summary: snapshot.summary,
		};

		return c.json<GetSnapshotDetailsDto>(response, 200);
	})
	.get(
		"/:name/snapshots/:snapshotId/files",
		listSnapshotFilesDto,
		validator("query", listSnapshotFilesQuery),
		async (c) => {
			const { name, snapshotId } = c.req.param();
			const { path } = c.req.valid("query");

			const result = await repositoriesService.listSnapshotFiles(name, snapshotId, path);

			c.header("Cache-Control", "max-age=300, stale-while-revalidate=600");

			return c.json<ListSnapshotFilesDto>(result, 200);
		},
	)
	.post("/:name/restore", restoreSnapshotDto, validator("json", restoreSnapshotBody), async (c) => {
		const { name } = c.req.param();
		const { snapshotId, include, exclude } = c.req.valid("json");

		const result = await repositoriesService.restoreSnapshot(name, snapshotId, { include, exclude });

		return c.json<RestoreSnapshotDto>(result, 200);
	});
