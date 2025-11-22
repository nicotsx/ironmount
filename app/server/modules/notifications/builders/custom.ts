import type { NotificationConfig } from "~/schemas/notifications";

export function buildCustomShoutrrrUrl(config: Extract<NotificationConfig, { type: "custom" }>): string {
	return config.shoutrrrUrl;
}
