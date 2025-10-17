import { Hono } from "hono";
import { validator } from "hono-openapi";
import {
	createVolumeBody,
	createVolumeDto,
	deleteVolumeDto,
	type GetVolumeResponseDto,
	getContainersDto,
	getVolumeDto,
	healthCheckDto,
	type ListContainersResponseDto,
	type ListFilesResponseDto,
	type ListVolumesResponseDto,
	listFilesDto,
	listVolumesDto,
	mountVolumeDto,
	testConnectionBody,
	testConnectionDto,
	type UpdateVolumeResponseDto,
	unmountVolumeDto,
	updateVolumeBody,
	updateVolumeDto,
} from "./volume.dto";
import { volumeService } from "./volume.service";

export const volumeController = new Hono()
	.get("/", listVolumesDto, async (c) => {
		const volumes = await volumeService.listVolumes();

		const response = {
			volumes: volumes.map((volume) => ({
				...volume,
				updatedAt: volume.updatedAt.getTime(),
				createdAt: volume.createdAt.getTime(),
				lastHealthCheck: volume.lastHealthCheck.getTime(),
			})),
		} satisfies ListVolumesResponseDto;

		return c.json(response, 200);
	})
	.post("/", createVolumeDto, validator("json", createVolumeBody), async (c) => {
		const body = c.req.valid("json");
		const res = await volumeService.createVolume(body.name, body.config);

		return c.json({ message: "Volume created", volume: res.volume }, 201);
	})
	.post("/test-connection", testConnectionDto, validator("json", testConnectionBody), async (c) => {
		const body = c.req.valid("json");
		const result = await volumeService.testConnection(body.config);

		return c.json(result, 200);
	})
	.delete("/:name", deleteVolumeDto, async (c) => {
		const { name } = c.req.param();
		await volumeService.deleteVolume(name);

		return c.json({ message: "Volume deleted" }, 200);
	})
	.get("/:name", getVolumeDto, async (c) => {
		const { name } = c.req.param();
		const res = await volumeService.getVolume(name);

		const response = {
			volume: {
				...res.volume,
				createdAt: res.volume.createdAt.getTime(),
				updatedAt: res.volume.updatedAt.getTime(),
				lastHealthCheck: res.volume.lastHealthCheck.getTime(),
			},
			statfs: {
				total: res.statfs.total ?? 0,
				used: res.statfs.used ?? 0,
				free: res.statfs.free ?? 0,
			},
		} satisfies GetVolumeResponseDto;

		return c.json(response, 200);
	})
	.get("/:name/containers", getContainersDto, async (c) => {
		const { name } = c.req.param();
		const { containers } = await volumeService.getContainersUsingVolume(name);

		const response = {
			containers,
		} satisfies ListContainersResponseDto;

		return c.json(response, 200);
	})
	.put("/:name", updateVolumeDto, validator("json", updateVolumeBody), async (c) => {
		const { name } = c.req.param();
		const body = c.req.valid("json");
		const res = await volumeService.updateVolume(name, body);

		const response = {
			message: "Volume updated",
			volume: {
				...res.volume,
				createdAt: res.volume.createdAt.getTime(),
				updatedAt: res.volume.updatedAt.getTime(),
				lastHealthCheck: res.volume.lastHealthCheck.getTime(),
			},
		} satisfies UpdateVolumeResponseDto;

		return c.json(response, 200);
	})
	.post("/:name/mount", mountVolumeDto, async (c) => {
		const { name } = c.req.param();
		const { error, status } = await volumeService.mountVolume(name);

		return c.json({ error, status }, error ? 500 : 200);
	})
	.post("/:name/unmount", unmountVolumeDto, async (c) => {
		const { name } = c.req.param();
		const { error, status } = await volumeService.unmountVolume(name);

		return c.json({ error, status }, error ? 500 : 200);
	})
	.post("/:name/health-check", healthCheckDto, async (c) => {
		const { name } = c.req.param();
		const { error, status } = await volumeService.checkHealth(name);

		return c.json({ error, status }, 200);
	})
	.get("/:name/files", listFilesDto, async (c) => {
		const { name } = c.req.param();
		const subPath = c.req.query("path");
		const result = await volumeService.listFiles(name, subPath);

		const response = {
			files: result.files,
			path: result.path,
		} satisfies ListFilesResponseDto;

		c.header("Cache-Control", "public, max-age=10, stale-while-revalidate=60");

		return c.json(response, 200);
	});
