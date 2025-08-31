import { Hono } from "hono";

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
	.post("/VolumeDriver.Create", (c) => {
		return c.json({
			Err: "",
		});
	})
	.post("/VolumeDriver.Remove", (c) => {
		return c.json({
			Err: "",
		});
	})
	.post("/VolumeDriver.Mount", (c) => {
		return c.json({
			Mountpoint: `/mnt/something`,
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
	.post("/VolumeDriver.Get", (c) => {
		return c.json({
			Name: "my-volume",
			Mountpoint: `/mnt/something`,
			Status: {},
		});
	})
	.post("/VolumeDriver.List", (c) => {
		return c.json({
			Volumes: [
				{
					Name: "my-volume",
					Mountpoint: `/mnt/something`,
					Status: {},
				},
			],
		});
	});
