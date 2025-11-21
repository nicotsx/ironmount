import { Hono } from "hono";
import { validator } from "hono-openapi";
import {
	createVolumeBody,
	createVolumeDto,
	deleteVolumeDto,
	getContainersDto,
	getVolumeDto,
	healthCheckDto,
	type ListVolumesDto,
	listFilesDto,
	listVolumesDto,
	mountVolumeDto,
	testConnectionBody,
	testConnectionDto,
	unmountVolumeDto,
	updateVolumeBody,
	updateVolumeDto,
	type CreateVolumeDto,
	type GetVolumeDto,
	type ListContainersDto,
	type UpdateVolumeDto,
	type ListFilesDto,
	browseFilesystemDto,
	type BrowseFilesystemDto,
} from "./volume.dto";
import { volumeService } from "./volume.service";
import { createVolumeBackend } from "../backends/backend";

export const volumeController = new Hono()
	.get("/", listVolumesDto, async (c) => {
		const volumes = await volumeService.listVolumes();

		return c.json<ListVolumesDto>(volumes, 200);
	})
	.post("/", createVolumeDto, validator("json", createVolumeBody), async (c) => {
		const body = c.req.valid("json");
		const res = await volumeService.createVolume(body.name, body.config);

		const backend = createVolumeBackend(res.volume);
		const response = {
			...res.volume,
			path: backend.getVolumePath(),
		};

		return c.json<CreateVolumeDto>(response, 201);
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

		const backend = createVolumeBackend(res.volume);
		const response = {
			volume: {
				...res.volume,
				path: backend.getVolumePath(),
			},
			statfs: {
				total: res.statfs.total ?? 0,
				used: res.statfs.used ?? 0,
				free: res.statfs.free ?? 0,
			},
		};

		return c.json<GetVolumeDto>(response, 200);
	})
	.get("/:name/containers", getContainersDto, async (c) => {
		const { name } = c.req.param();
		const { containers } = await volumeService.getContainersUsingVolume(name);

		return c.json<ListContainersDto>(containers, 200);
	})
	.put("/:name", updateVolumeDto, validator("json", updateVolumeBody), async (c) => {
		const { name } = c.req.param();
		const body = c.req.valid("json");
		const res = await volumeService.updateVolume(name, body);

		const backend = createVolumeBackend(res.volume);
		const response = {
			...res.volume,
			path: backend.getVolumePath(),
		};

		return c.json<UpdateVolumeDto>(response, 200);
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
		};

		c.header("Cache-Control", "public, max-age=10, stale-while-revalidate=60");

		return c.json<ListFilesDto>(response, 200);
	})
	.get("/filesystem/browse", browseFilesystemDto, async (c) => {
		const path = c.req.query("path") || "/";
		const result = await volumeService.browseFilesystem(path);

		const response = {
			directories: result.directories,
			path: result.path,
		};

		return c.json<BrowseFilesystemDto>(response, 200);
	});
