import { Hono } from "hono";
import { validator } from "hono-openapi";
import {
	createRepositoryBody,
	createRepositoryDto,
	deleteRepositoryDto,
	getRepositoryDto,
	type GetRepositoryResponseDto,
	type ListRepositoriesResponseDto,
	listRepositoriesDto,
	listSnapshotsDto,
	type ListSnapshotsResponseDto,
} from "./repositories.dto";
import { repositoriesService } from "./repositories.service";

export const repositoriesController = new Hono()
	.get("/", listRepositoriesDto, async (c) => {
		const repositories = await repositoriesService.listRepositories();

		const response = {
			repositories: repositories.map((repository) => ({
				...repository,
				updatedAt: repository.updatedAt.getTime(),
				createdAt: repository.createdAt.getTime(),
				lastChecked: repository.lastChecked?.getTime() ?? null,
			})),
		} satisfies ListRepositoriesResponseDto;

		return c.json(response, 200);
	})
	.post("/", createRepositoryDto, validator("json", createRepositoryBody), async (c) => {
		const body = c.req.valid("json");
		const res = await repositoriesService.createRepository(body.name, body.config, body.compressionMode);

		return c.json({ message: "Repository created", repository: res.repository }, 201);
	})
	.get("/:name", getRepositoryDto, async (c) => {
		const { name } = c.req.param();
		const res = await repositoriesService.getRepository(name);

		const response = {
			repository: {
				...res.repository,
				createdAt: res.repository.createdAt.getTime(),
				updatedAt: res.repository.updatedAt.getTime(),
				lastChecked: res.repository.lastChecked?.getTime() ?? null,
			},
		} satisfies GetRepositoryResponseDto;

		return c.json(response, 200);
	})
	.delete("/:name", deleteRepositoryDto, async (c) => {
		const { name } = c.req.param();
		await repositoriesService.deleteRepository(name);

		return c.json({ message: "Repository deleted" }, 200);
	})
	.get("/:name/snapshots", listSnapshotsDto, async (c) => {
		const { name } = c.req.param();
		const res = await repositoriesService.listSnapshots(name);

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

		const response = { snapshots } satisfies ListSnapshotsResponseDto;

		c.header("Cache-Control", "max-age=30, stale-while-revalidate=300");

		return c.json(response, 200);
	});
