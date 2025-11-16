import { Hono } from "hono";
import { volumeService } from "../volumes/volume.service";
import { createVolumeBackend } from "../backends/backend";
import { VOLUME_MOUNT_BASE } from "../../core/constants";

export const driverController = new Hono()
	.post("/VolumeDriver.Capabilities", (c) => {
		return c.json({
			Capabilities: {
				Scope: "global",
			},
		});
	})
	.post("/Plugin.Activate", (c) => {
		return c.json({
			Implements: ["VolumeDriver"],
		});
	})
	.post("/VolumeDriver.Create", (_) => {
		throw new Error("Volume creation is not supported via the driver");
	})
	.post("/VolumeDriver.Remove", (c) => {
		return c.json({
			Err: "",
		});
	})
	.post("/VolumeDriver.Mount", async (c) => {
		const body = await c.req.json();

		if (!body.Name) {
			return c.json({ Err: "Volume name is required" }, 400);
		}

		const volumeName = body.Name.replace(/^im-/, "");
		const { volume } = await volumeService.getVolume(volumeName);
		const backend = createVolumeBackend(volume);

		return c.json({
			Mountpoint: backend.getVolumePath(),
		});
	})
	.post("/VolumeDriver.Unmount", (c) => {
		return c.json({
			Err: "",
		});
	})
	.post("/VolumeDriver.Path", async (c) => {
		const body = await c.req.json();

		if (!body.Name) {
			return c.json({ Err: "Volume name is required" }, 400);
		}

		const { volume } = await volumeService.getVolume(body.Name.replace(/^im-/, ""));
		const backend = createVolumeBackend(volume);

		return c.json({
			Mountpoint: backend.getVolumePath(),
		});
	})
	.post("/VolumeDriver.Get", async (c) => {
		const body = await c.req.json();

		if (!body.Name) {
			return c.json({ Err: "Volume name is required" }, 400);
		}

		const { volume } = await volumeService.getVolume(body.Name.replace(/^im-/, ""));
		const backend = createVolumeBackend(volume);

		return c.json({
			Volume: {
				Name: `im-${volume.name}`,
				Mountpoint: backend.getVolumePath(),
				Status: {},
			},
			Err: "",
		});
	})
	.post("/VolumeDriver.List", async (c) => {
		const volumes = await volumeService.listVolumes();

		const res = volumes.map((volume) => {
			const backend = createVolumeBackend(volume);
			return {
				Name: `im-${volume.name}`,
				Mountpoint: backend.getVolumePath(),
				Status: {},
			};
		});

		return c.json({
			Volumes: res,
		});
	});
