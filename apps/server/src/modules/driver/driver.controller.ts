import { Hono } from "hono";
import { VOLUME_MOUNT_BASE } from "../../core/constants";
import { volumeService } from "../volumes/volume.service";

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

		const mountpoint = `${VOLUME_MOUNT_BASE}/${volumeName}/_data`;

		return c.json({
			Mountpoint: mountpoint,
		});
	})
	.post("/VolumeDriver.Unmount", (c) => {
		return c.json({
			Err: "",
		});
	})
	.post("/VolumeDriver.Path", (c) => {
		return c.json({
			Mountpoint: `/mnt/something`,
		});
	})
	.post("/VolumeDriver.Get", async (c) => {
		const body = await c.req.json();

		if (!body.Name) {
			return c.json({ Err: "Volume name is required" }, 400);
		}

		const { volume } = await volumeService.getVolume(body.Name.replace(/^im-/, ""));

		return c.json({
			Volume: {
				Name: `im-${volume.name}`,
				Mountpoint: `${VOLUME_MOUNT_BASE}/${volume.name}/_data`,
				Status: {},
			},
			Err: "",
		});
	})
	.post("/VolumeDriver.List", async (c) => {
		const volumes = await volumeService.listVolumes();

		const res = volumes.map((volume) => ({
			Name: `im-${volume.name}`,
			Mountpoint: `${VOLUME_MOUNT_BASE}/${volume.name}/_data`,
			Status: {},
		}));

		return c.json({
			Volumes: res,
		});
	});
