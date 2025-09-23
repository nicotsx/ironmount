import * as fs from "node:fs/promises";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { openAPISpecs } from "hono-openapi";
import { runDbMigrations } from "./db/db";
import { driverController } from "./modules/driver/driver.controller";
import { volumeController } from "./modules/volumes/volume.controller";
import { logger } from "./utils/logger";
import { startup } from "./modules/lifecycle/startup";

export const generalDescriptor = (app: Hono) =>
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Ironmount API",
				version: "1.0.0",
				description: "API for managing volumes",
			},
			servers: [{ url: "http://localhost:3000", description: "Development Server" }],
		},
	});

export const scalarDescriptor = Scalar({
	title: "Ironmount API Docs",
	pageTitle: "Ironmount API Docs",
	url: "/api/v1/openapi.json",
});

const driver = new Hono().use(honoLogger()).route("/", driverController);
const app = new Hono()
	.use(honoLogger())
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

	await startup();

	logger.info(`Server is running at http://localhost:8080 and unix socket at ${socketPath}`);
})();

export type AppType = typeof app;
