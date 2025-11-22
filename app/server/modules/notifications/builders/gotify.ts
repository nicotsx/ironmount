import type { NotificationConfig } from "~/schemas/notifications";

export function buildGotifyShoutrrrUrl(config: Extract<NotificationConfig, { type: "gotify" }>): string {
	const url = new URL(config.serverUrl);
	const hostname = url.hostname;
	const port = url.port ? `:${url.port}` : "";

	let shoutrrrUrl = `gotify://${hostname}${port}/${config.token}`;

	if (config.priority !== undefined) {
		shoutrrrUrl += `?priority=${config.priority}`;
	}

	return shoutrrrUrl;
}
