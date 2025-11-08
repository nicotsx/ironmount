import { Hono } from "hono";
import { systemInfoDto, type SystemInfoDto } from "./system.dto";
import { systemService } from "./system.service";

export const systemController = new Hono().get("/info", systemInfoDto, async (c) => {
	const info = await systemService.getSystemInfo();

	return c.json<SystemInfoDto>(info, 200);
});
