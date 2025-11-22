import { type } from "arktype";

export const NOTIFICATION_TYPES = {
	email: "email",
	slack: "slack",
	discord: "discord",
	gotify: "gotify",
	ntfy: "ntfy",
	custom: "custom",
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export const emailNotificationConfigSchema = type({
	type: "'email'",
	smtpHost: "string",
	smtpPort: "1 <= number <= 65535",
	username: "string",
	password: "string",
	from: "string",
	to: "string[]",
	useTLS: "boolean",
});

export const slackNotificationConfigSchema = type({
	type: "'slack'",
	webhookUrl: "string",
	channel: "string?",
	username: "string?",
	iconEmoji: "string?",
});

export const discordNotificationConfigSchema = type({
	type: "'discord'",
	webhookUrl: "string",
	username: "string?",
	avatarUrl: "string?",
});

export const gotifyNotificationConfigSchema = type({
	type: "'gotify'",
	serverUrl: "string",
	token: "string",
	priority: "0 <= number <= 10",
});

export const ntfyNotificationConfigSchema = type({
	type: "'ntfy'",
	serverUrl: "string?",
	topic: "string",
	token: "string?",
	priority: "'max' | 'high' | 'default' | 'low' | 'min'",
});

export const customNotificationConfigSchema = type({
	type: "'custom'",
	shoutrrrUrl: "string",
});

export const notificationConfigSchema = emailNotificationConfigSchema
	.or(slackNotificationConfigSchema)
	.or(discordNotificationConfigSchema)
	.or(gotifyNotificationConfigSchema)
	.or(ntfyNotificationConfigSchema)
	.or(customNotificationConfigSchema);

export type NotificationConfig = typeof notificationConfigSchema.infer;

export const NOTIFICATION_EVENTS = {
	start: "start",
	success: "success",
	failure: "failure",
} as const;

export type NotificationEvent = keyof typeof NOTIFICATION_EVENTS;
