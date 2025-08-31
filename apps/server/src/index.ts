import * as fs from "node:fs/promises";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { driverController } from "./controllers/driver.controller";
import { volumeController } from "./controllers/volume.controller";
import { runDbMigrations } from "./db/db";
import {
	generalDescriptor,
	scalarDescriptor,
} from "./descriptors/general.descriptors";

const driver = new Hono().use(logger()).route("/", driverController);
const app = new Hono()
	.use(logger())
	.get("healthcheck", (c) => c.json({ status: "ok" }))
	.basePath("/api/v1")
	.route("/volumes", volumeController);

app.get("/openapi.json", generalDescriptor(app));
app.get("/docs", scalarDescriptor);

app.get("/", (c) => {
	return c.json({ message: "Welcome to the Ironmount API" });
});

const socketPath = "/run/docker/plugins/ironmount.sock";

(async () => {
	await fs.mkdir("/run/docker/plugins", { recursive: true });

	runDbMigrations();

	Bun.serve({
		unix: socketPath,
		fetch: driver.fetch,
	});

	Bun.serve({
		port: 8080,
		fetch: app.fetch,
	});

	console.log(
		`Server is running at http://localhost:8080 and unix socket at ${socketPath}`,
	);
})();

export type AppType = typeof app;
