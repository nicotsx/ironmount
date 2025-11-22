import type { NotificationConfig } from "~/schemas/notifications";

export function buildEmailShoutrrrUrl(config: Extract<NotificationConfig, { type: "email" }>): string {
	const protocol = config.useTLS ? "smtps" : "smtp";
	const auth = `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}`;
	const host = `${config.smtpHost}:${config.smtpPort}`;
	const toRecipients = config.to.map((email) => encodeURIComponent(email)).join(",");

	return `${protocol}://${auth}@${host}/?from=${encodeURIComponent(config.from)}&to=${toRecipients}`;
}
