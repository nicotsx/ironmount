import { deleteCookie, getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { authService } from "./auth.service";

const COOKIE_NAME = "session_id";
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
};

declare module "hono" {
	interface ContextVariableMap {
		user: {
			id: number;
			username: string;
			hasDownloadedResticPassword: boolean;
		};
	}
}

/**
 * Middleware to require authentication
 * Verifies the session cookie and attaches user to context
 */
export const requireAuth = createMiddleware(async (c, next) => {
	const sessionId = getCookie(c, COOKIE_NAME);

	if (!sessionId) {
		return c.json({ message: "Authentication required" }, 401);
	}

	const session = await authService.verifySession(sessionId);

	if (!session) {
		deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
		return c.json({ message: "Invalid or expired session" }, 401);
	}

	c.set("user", session.user);

	await next();
});

/**
 * Middleware to optionally attach user if authenticated
 * Does not block the request if not authenticated
 */
export const optionalAuth = createMiddleware(async (c, next) => {
	const sessionId = getCookie(c, COOKIE_NAME);

	if (sessionId) {
		const session = await authService.verifySession(sessionId);

		if (session) {
			c.set("user", session.user);
		} else {
			deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
		}
	}

	await next();
});
