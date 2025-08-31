import { type } from "arktype";
import { Hono } from "hono";
import {
	listVolumesDescriptor,
	listVolumesResponse,
} from "../descriptors/volume.descriptors";

export const volumeController = new Hono()
	.get("/", listVolumesDescriptor, (c) => {
		const res = listVolumesResponse({
			volumes: [],
		});

		if (res instanceof type.errors) {
			return c.json({ error: "Invalid response format" }, 500);
		}

		return c.json(res, 200);
	})
	.post("/", (c) => {
		return c.json({ message: "Create a new volume" }, 201);
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
