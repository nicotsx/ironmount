import { Job } from "../core/scheduler";
import { authService } from "../modules/auth/auth.service";

export class CleanupSessionsJob extends Job {
	async run() {
		authService.cleanupExpiredSessions();

		return { done: true, timestamp: new Date() };
	}
}
