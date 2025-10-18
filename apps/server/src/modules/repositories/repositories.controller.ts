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
	});
