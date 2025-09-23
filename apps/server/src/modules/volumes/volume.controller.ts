import { Hono } from "hono";
import { validator } from "hono-openapi/arktype";
import { handleServiceError } from "../../utils/errors";
import {
	createVolumeBody,
	createVolumeDto,
	deleteVolumeDto,
	getVolumeDto,
	type ListVolumesResponseDto,
	listVolumesDto,
	testConnectionBody,
	testConnectionDto,
	updateVolumeBody,
	updateVolumeDto,
	type VolumeDto,
	mountVolumeDto,
	unmountVolumeDto,
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

		if (res.error) {
			const { message, status } = handleServiceError(res.error);
			return c.json(message, status);
		}

		return c.json({ message: "Volume created", volume: res.volume });
	})
	.post("/test-connection", testConnectionDto, validator("json", testConnectionBody), async (c) => {
		const body = c.req.valid("json");
		const result = await volumeService.testConnection(body.config);

		return c.json(result, 200);
	})
	.delete("/:name", deleteVolumeDto, async (c) => {
		const { name } = c.req.param();
		const res = await volumeService.deleteVolume(name);

		if (res.error) {
			const { message, status } = handleServiceError(res.error);
			return c.json(message, status);
		}

		return c.json({ message: "Volume deleted" });
	})
	.get("/:name", getVolumeDto, async (c) => {
		const { name } = c.req.param();
		const res = await volumeService.getVolume(name);

		if (res.error) {
			const { message, status } = handleServiceError(res.error);
			return c.json(message, status);
		}

		const response = {
			...res.volume,
			createdAt: res.volume.createdAt.getTime(),
			updatedAt: res.volume.updatedAt.getTime(),
			lastHealthCheck: res.volume.lastHealthCheck.getTime(),
		} satisfies VolumeDto;

		return c.json(response, 200);
	})
	.put("/:name", updateVolumeDto, validator("json", updateVolumeBody), async (c) => {
		const { name } = c.req.param();
		const body = c.req.valid("json");
		const res = await volumeService.updateVolume(name, body.config);

		if (res.error) {
			const { message, status } = handleServiceError(res.error);
			return c.json(message, status);
		}

		const response = {
			message: "Volume updated",
			volume: {
				name: res.volume.name,
				path: res.volume.path,
				type: res.volume.type,
				createdAt: res.volume.createdAt.getTime(),
				updatedAt: res.volume.updatedAt.getTime(),
				config: res.volume.config,
			},
		};

		return c.json(response, 200);
	})
	.post("/:name/mount", mountVolumeDto, async (c) => {
		const { name } = c.req.param();
		const res = await volumeService.mountVolume(name);

		if (res.error) {
			const { message, status } = handleServiceError(res.error);
			return c.json(message, status);
		}

		return c.json({ message: "Volume mounted successfully" }, 200);
	})
	.post("/:name/unmount", unmountVolumeDto, async (c) => {
		const { name } = c.req.param();
		const res = await volumeService.unmountVolume(name);

		if (res.error) {
			const { message, status } = handleServiceError(res.error);
			return c.json(message, status);
		}

		return c.json({ message: "Volume unmounted successfully" }, 200);
	});
