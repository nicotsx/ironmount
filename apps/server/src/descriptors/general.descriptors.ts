import { Scalar } from "@scalar/hono-api-reference";
import type { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";

export const generalDescriptor = (app: Hono) =>
	openAPISpecs(app, {
		documentation: {
			info: {
				title: "Ironmount API",
				version: "1.0.0",
				description: "API for managing Docker volumes",
			},
			servers: [
				{ url: "http://localhost:3000", description: "Development Server" },
			],
		},
	});

export const scalarDescriptor = Scalar({
	title: "Ironmount API Docs",
	pageTitle: "Ironmount API Docs",
	url: "/api/v1/openapi.json",
});
