import { type } from "arktype";
import { describeRoute, resolver } from "hono-openapi";

// Validation schemas
export const loginBodySchema = type({
	username: "string>0",
	password: "string>7",
});

export const registerBodySchema = type({
	username: "string>2",
	password: "string>7",
});

const loginResponseSchema = type({
	message: "string",
	success: "boolean",
	user: type({
		id: "number",
		username: "string",
	}).optional(),
});

export const loginDto = describeRoute({
	description: "Login with username and password",
	operationId: "login",
	tags: ["Auth"],
	responses: {
		200: {
			description: "Login successful",
			content: {
				"application/json": {
					schema: resolver(loginResponseSchema),
				},
			},
		},
		401: {
			description: "Invalid credentials",
		},
	},
});

export type LoginDto = typeof loginResponseSchema.infer;

export const registerDto = describeRoute({
	description: "Register a new user",
	operationId: "register",
	tags: ["Auth"],
	responses: {
		201: {
			description: "User created successfully",
			content: {
				"application/json": {
					schema: resolver(loginResponseSchema),
				},
			},
		},
		400: {
			description: "Invalid request or username already exists",
		},
	},
});

export type RegisterDto = typeof loginResponseSchema.infer;

const logoutResponseSchema = type({
	success: "boolean",
});

export const logoutDto = describeRoute({
	description: "Logout current user",
	operationId: "logout",
	tags: ["Auth"],
	responses: {
		200: {
			description: "Logout successful",
			content: {
				"application/json": {
					schema: resolver(logoutResponseSchema),
				},
			},
		},
	},
});

export type LogoutDto = typeof logoutResponseSchema.infer;

export const getMeDto = describeRoute({
	description: "Get current authenticated user",
	operationId: "getMe",
	tags: ["Auth"],
	responses: {
		200: {
			description: "Current user information",
			content: {
				"application/json": {
					schema: resolver(loginResponseSchema),
				},
			},
		},
	},
});

export type GetMeDto = typeof loginResponseSchema.infer;

const statusResponseSchema = type({
	hasUsers: "boolean",
});

export const getStatusDto = describeRoute({
	description: "Get authentication system status",
	operationId: "getStatus",
	tags: ["Auth"],
	responses: {
		200: {
			description: "Authentication system status",
			content: {
				"application/json": {
					schema: resolver(statusResponseSchema),
				},
			},
		},
	},
});

export type GetStatusDto = typeof statusResponseSchema.infer;

export type LoginBody = typeof loginBodySchema.infer;
export type RegisterBody = typeof registerBodySchema.infer;
