import type { NotificationConfig } from "~/schemas/notifications";
import { buildEmailShoutrrrUrl } from "./email";
import { buildSlackShoutrrrUrl } from "./slack";
import { buildDiscordShoutrrrUrl } from "./discord";
import { buildGotifyShoutrrrUrl } from "./gotify";
import { buildNtfyShoutrrrUrl } from "./ntfy";
import { buildCustomShoutrrrUrl } from "./custom";

export function buildShoutrrrUrl(config: NotificationConfig): string {
	switch (config.type) {
		case "email":
			return buildEmailShoutrrrUrl(config);
		case "slack":
			return buildSlackShoutrrrUrl(config);
		case "discord":
			return buildDiscordShoutrrrUrl(config);
		case "gotify":
			return buildGotifyShoutrrrUrl(config);
		case "ntfy":
			return buildNtfyShoutrrrUrl(config);
		case "custom":
			return buildCustomShoutrrrUrl(config);
		default: {
			// TypeScript exhaustiveness check
			const _exhaustive: never = config;
			throw new Error(`Unsupported notification type: ${(_exhaustive as NotificationConfig).type}`);
		}
	}
}
