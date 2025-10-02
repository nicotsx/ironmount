import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { sessionsTable, usersTable } from "../../db/schema";
import { logger } from "../../utils/logger";

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days

export class AuthService {
	/**
	 * Register a new user with username and password
	 */
	async register(username: string, password: string) {
		const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.username, username));

		if (existingUser) {
			throw new Error("Username already exists");
		}

		const passwordHash = await Bun.password.hash(password, {
			algorithm: "argon2id",
			memoryCost: 19456,
			timeCost: 2,
		});

		const [user] = await db.insert(usersTable).values({ username, passwordHash }).returning();

		if (!user) {
			throw new Error("User registration failed");
		}

		logger.info(`User registered: ${username}`);

		return { user: { id: user.id, username: user.username, createdAt: user.createdAt } };
	}

	/**
	 * Login user with username and password
	 */
	async login(username: string, password: string) {
		const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

		if (!user) {
			throw new Error("Invalid credentials");
		}

		const isValid = await Bun.password.verify(password, user.passwordHash);

		if (!isValid) {
			throw new Error("Invalid credentials");
		}

		const sessionId = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + SESSION_DURATION);

		await db.insert(sessionsTable).values({
			id: sessionId,
			userId: user.id,
			expiresAt,
		});

		logger.info(`User logged in: ${username}`);

		return {
			sessionId,
			user: { id: user.id, username: user.username },
			expiresAt,
		};
	}

	/**
	 * Logout user by deleting their session
	 */
	async logout(sessionId: string) {
		await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
		logger.info(`User logged out: session ${sessionId}`);
	}

	/**
	 * Verify a session and return the associated user
	 */
	async verifySession(sessionId: string) {
		const [session] = await db
			.select({
				session: sessionsTable,
				user: usersTable,
			})
			.from(sessionsTable)
			.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
			.where(eq(sessionsTable.id, sessionId));

		if (!session) {
			return null;
		}

		if (session.session.expiresAt < new Date()) {
			await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
			return null;
		}

		return {
			user: {
				id: session.user.id,
				username: session.user.username,
			},
			session: {
				id: session.session.id,
				expiresAt: session.session.expiresAt,
			},
		};
	}

	/**
	 * Clean up expired sessions
	 */
	async cleanupExpiredSessions() {
		const result = await db.delete(sessionsTable).where(eq(sessionsTable.expiresAt, new Date())).returning();
		if (result.length > 0) {
			logger.info(`Cleaned up ${result.length} expired sessions`);
		}
	}
}

export const authService = new AuthService();
