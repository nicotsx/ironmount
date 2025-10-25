import * as fs from "node:fs/promises";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { logger as honoLogger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";
import { runDbMigrations } from "./db/db";
import { authController } from "./modules/auth/auth.controller";
import { requireAuth } from "./modules/auth/auth.middleware";
import { driverController } from "./modules/driver/driver.controller";
import { startup } from "./modules/lifecycle/startup";
import { repositoriesController } from "./modules/repositories/repositories.controller";
import { volumeController } from "./modules/volumes/volume.controller";
import { backupScheduleController } from "./modules/backups/backups.controller";
import { handleServiceError } from "./utils/errors";
import { logger } from "./utils/logger";

export const generalDescriptor = (app: Hono) =>
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Ironmount API",
				version: "1.0.0",
				description: "API for managing volumes",
			},
			servers: [{ url: "http://192.168.2.42:4096", description: "Development Server" }],
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
	.route("/api/v1/auth", authController.basePath("/api/v1"))
	.route("/api/v1/volumes", volumeController.use(requireAuth))
	.route("/api/v1/repositories", repositoriesController.use(requireAuth))
	.route("/api/v1/backups", backupScheduleController.use(requireAuth))
	.get("/assets/*", serveStatic({ root: "./assets/frontend" }))
	.get("*", serveStatic({ path: "./assets/frontend/index.html" }));

app.get("/api/v1/openapi.json", generalDescriptor(app));
app.get("/api/v1/docs", scalarDescriptor);

app.onError((err, c) => {
	logger.error(`${c.req.url}: ${err.message}`);

	if (err.cause instanceof Error) {
		logger.error(err.cause.message);
	}

	const { status, message } = handleServiceError(err);

	return c.json({ message }, status);
});

const socketPath = "/run/docker/plugins/ironmount.sock";

await fs.mkdir("/run/docker/plugins", { recursive: true });
runDbMigrations();

Bun.serve({
	unix: socketPath,
	fetch: driver.fetch,
});

Bun.serve({
	port: 4096,
	fetch: app.fetch,
});

startup();

logger.info(`Server is running at http://localhost:4096 and unix socket at ${socketPath}`);

export type AppType = typeof app;
