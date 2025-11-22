import type { NotificationConfig } from "~/schemas/notifications";

export function buildDiscordShoutrrrUrl(config: Extract<NotificationConfig, { type: "discord" }>): string {
	const url = new URL(config.webhookUrl);
	const pathParts = url.pathname.split("/").filter(Boolean);

	if (pathParts.length < 4 || pathParts[0] !== "api" || pathParts[1] !== "webhooks") {
		throw new Error("Invalid Discord webhook URL format");
	}

	const [, , webhookId, webhookToken] = pathParts;

	let shoutrrrUrl = `discord://${webhookToken}@${webhookId}`;

	const params = new URLSearchParams();
	if (config.username) {
		params.append("username", config.username);
	}
	if (config.avatarUrl) {
		params.append("avatar_url", config.avatarUrl);
	}

	if (params.toString()) {
		shoutrrrUrl += `?${params.toString()}`;
	}

	return shoutrrrUrl;
}
