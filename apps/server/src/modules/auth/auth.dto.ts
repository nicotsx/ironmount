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
	user: type({
		id: "string",
		username: "string",
	}),
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

export const logoutDto = describeRoute({
	description: "Logout current user",
	operationId: "logout",
	tags: ["Auth"],
	responses: {
		200: {
			description: "Logout successful",
			content: {
				"application/json": {
					schema: resolver(type({ message: "string" })),
				},
			},
		},
	},
});

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
		401: {
			description: "Not authenticated",
		},
	},
});

export type LoginBody = typeof loginBodySchema.infer;
export type RegisterBody = typeof registerBodySchema.infer;
