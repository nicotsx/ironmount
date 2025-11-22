import type { NotificationConfig } from "~/schemas/notifications";

export function buildNtfyShoutrrrUrl(config: Extract<NotificationConfig, { type: "ntfy" }>): string {
	let shoutrrrUrl: string;

	if (config.serverUrl) {
		const url = new URL(config.serverUrl);
		const hostname = url.hostname;
		const port = url.port ? `:${url.port}` : "";
		shoutrrrUrl = `ntfy://${hostname}${port}/${config.topic}`;
	} else {
		shoutrrrUrl = `ntfy://ntfy.sh/${config.topic}`;
	}

	const params = new URLSearchParams();
	if (config.token) {
		params.append("token", config.token);
	}
	if (config.priority) {
		params.append("priority", config.priority);
	}

	if (params.toString()) {
		shoutrrrUrl += `?${params.toString()}`;
	}

	return shoutrrrUrl;
}
