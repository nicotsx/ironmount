import { validator } from "hono-openapi";

import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
	getMeDto,
	getStatusDto,
	loginBodySchema,
	loginDto,
	logoutDto,
	registerBodySchema,
	registerDto,
} from "./auth.dto";
import { authService } from "./auth.service";

const COOKIE_NAME = "session_id";
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
};

export const authController = new Hono()
	.post("/register", registerDto, validator("json", registerBodySchema), async (c) => {
		const body = c.req.valid("json");

		try {
			const { user, sessionId } = await authService.register(body.username, body.password);

			setCookie(c, COOKIE_NAME, sessionId, {
				...COOKIE_OPTIONS,
				expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			});

			return c.json({ message: "User registered successfully", user: { id: user.id, username: user.username } }, 201);
		} catch (error) {
			return c.json({ message: error instanceof Error ? error.message : "Registration failed" }, 400);
		}
	})
	.post("/login", loginDto, validator("json", loginBodySchema), async (c) => {
		const body = c.req.valid("json");

		try {
			const { sessionId, user, expiresAt } = await authService.login(body.username, body.password);

			setCookie(c, COOKIE_NAME, sessionId, {
				...COOKIE_OPTIONS,
				expires: expiresAt,
			});

			return c.json({
				message: "Login successful",
				user: { id: user.id, username: user.username },
			});
		} catch (error) {
			return c.json({ message: error instanceof Error ? error.message : "Login failed" }, 401);
		}
	})
	.post("/logout", logoutDto, async (c) => {
		const sessionId = getCookie(c, COOKIE_NAME);

		if (sessionId) {
			await authService.logout(sessionId);
			deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
		}

		return c.json({ message: "Logout successful" });
	})
	.get("/me", getMeDto, async (c) => {
		const sessionId = getCookie(c, COOKIE_NAME);

		if (!sessionId) {
			return c.json({ message: "Not authenticated" }, 401);
		}

		const session = await authService.verifySession(sessionId);

		if (!session) {
			deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
			return c.json({ message: "Not authenticated" }, 401);
		}

		return c.json({
			user: session.user,
		});
	})
	.get("/status", getStatusDto, async (c) => {
		const hasUsers = await authService.hasUsers();
		return c.json({ hasUsers });
	});
