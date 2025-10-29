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
	type GetMeDto,
	type GetStatusDto,
	type LoginDto,
	type LogoutDto,
	type RegisterDto,
} from "./auth.dto";
import { authService } from "./auth.service";
import { toMessage } from "../../utils/errors";

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

			return c.json<RegisterDto>(
				{ success: true, message: "User registered successfully", user: { id: user.id, username: user.username } },
				201,
			);
		} catch (error) {
			return c.json<RegisterDto>({ success: false, message: toMessage(error) }, 400);
		}
	})
	.post("/login", loginDto, validator("json", loginBodySchema), async (c) => {
		const body = c.req.valid("json");

		try {
			const { sessionId, user, expiresAt } = await authService.login(body.username, body.password);

			setCookie(c, COOKIE_NAME, sessionId, {
				...COOKIE_OPTIONS,
				expires: new Date(expiresAt),
			});

			return c.json<LoginDto>({
				success: true,
				message: "Login successful",
				user: { id: user.id, username: user.username },
			});
		} catch (error) {
			return c.json<LoginDto>({ success: false, message: toMessage(error) }, 401);
		}
	})
	.post("/logout", logoutDto, async (c) => {
		const sessionId = getCookie(c, COOKIE_NAME);

		if (sessionId) {
			await authService.logout(sessionId);
			deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
		}

		return c.json<LogoutDto>({ success: true });
	})
	.get("/me", getMeDto, async (c) => {
		const sessionId = getCookie(c, COOKIE_NAME);

		if (!sessionId) {
			return c.json<GetMeDto>({ success: false, message: "Not authenticated" }, 401);
		}

		const session = await authService.verifySession(sessionId);

		if (!session) {
			deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
			return c.json({ message: "Not authenticated" }, 401);
		}

		return c.json<GetMeDto>({
			success: true,
			user: session.user,
			message: "Authenticated",
		});
	})
	.get("/status", getStatusDto, async (c) => {
		const hasUsers = await authService.hasUsers();
		return c.json<GetStatusDto>({ hasUsers });
	});
