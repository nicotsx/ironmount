import { Hono } from "hono";
import { validator } from "hono-openapi/arktype";
import { handleServiceError } from "../../utils/errors";
import {
	createVolumeBody,
	createVolumeDto,
	deleteVolumeDto,
	type ListVolumesResponseDto,
	listVolumesDto,
} from "./volume.dto";
import { volumeService } from "./volume.service";

export const volumeController = new Hono()
	.get("/", listVolumesDto, async (c) => {
		const volumes = await volumeService.listVolumes();

		const response = {
			volumes: volumes.map((volume) => ({
				name: volume.name,
				path: volume.path,
				createdAt: volume.createdAt.getTime(),
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
	.delete("/:name", deleteVolumeDto, async (c) => {
		const { name } = c.req.param();
		const res = await volumeService.deleteVolume(name);

		if (res.error) {
			const { message, status } = handleServiceError(res.error);
			return c.json(message, status);
		}

		return c.json({ message: "Volume deleted" });
	})
	.get("/:name", (c) => {
		return c.json({ message: `Details of volume ${c.req.param("name")}` });
	})
	.put("/:name", (c) => {
		return c.json({ message: `Update volume ${c.req.param("name")}` });
	})
	.delete("/:name", (c) => {
		return c.json({ message: `Delete volume ${c.req.param("name")}` });
	});
