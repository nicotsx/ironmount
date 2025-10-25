import { type } from "arktype";
import { describeRoute, resolver } from "hono-openapi";

const retentionPolicySchema = type({
	keepLast: "number?",
	keepHourly: "number?",
	keepDaily: "number?",
	keepWeekly: "number?",
	keepMonthly: "number?",
	keepYearly: "number?",
	keepWithinDuration: "string?",
});

export type RetentionPolicy = typeof retentionPolicySchema.infer;

const backupScheduleSchema = type({
	id: "number",
	volumeId: "number",
	volumeName: "string",
	repositoryId: "string",
	repositoryName: "string",
	enabled: "boolean",
	cronExpression: "string",
	retentionPolicy: retentionPolicySchema.or("null"),
	excludePatterns: "string[]",
	includePatterns: "string[]",
	lastBackupAt: "number | null",
	lastBackupStatus: "'success' | 'error' | null",
	lastBackupError: "string | null",
	nextBackupAt: "number | null",
	createdAt: "number",
	updatedAt: "number",
});

export type BackupScheduleDto = typeof backupScheduleSchema.infer;

/**
 * List all backup schedules
 */
export const listBackupSchedulesResponse = type({
	schedules: backupScheduleSchema.array(),
});

export type ListBackupSchedulesResponseDto = typeof listBackupSchedulesResponse.infer;

export const listBackupSchedulesDto = describeRoute({
	description: "List all backup schedules",
	tags: ["Backups"],
	operationId: "listBackupSchedules",
	responses: {
		200: {
			description: "List of backup schedules",
			content: {
				"application/json": {
					schema: resolver(listBackupSchedulesResponse),
				},
			},
		},
	},
});

/**
 * Get a single backup schedule
 */
export const getBackupScheduleResponse = type({
	schedule: backupScheduleSchema,
});

export type GetBackupScheduleResponseDto = typeof getBackupScheduleResponse.infer;

export const getBackupScheduleDto = describeRoute({
	description: "Get a backup schedule by ID",
	tags: ["Backups"],
	operationId: "getBackupSchedule",
	responses: {
		200: {
			description: "Backup schedule details",
			content: {
				"application/json": {
					schema: resolver(getBackupScheduleResponse),
				},
			},
		},
	},
});

/**
 * Create a new backup schedule
 */
export const createBackupScheduleBody = type({
	volumeId: "number",
	repositoryId: "string",
	enabled: "boolean",
	cronExpression: "string",
	retentionPolicy: retentionPolicySchema.optional(),
	excludePatterns: "string[]?",
	includePatterns: "string[]?",
	tags: "string[]?",
});

export type CreateBackupScheduleBody = typeof createBackupScheduleBody.infer;

export const createBackupScheduleResponse = type({
	message: "string",
	schedule: backupScheduleSchema,
});

export const createBackupScheduleDto = describeRoute({
	description: "Create a new backup schedule for a volume",
	operationId: "createBackupSchedule",
	tags: ["Backups"],
	responses: {
		201: {
			description: "Backup schedule created successfully",
			content: {
				"application/json": {
					schema: resolver(createBackupScheduleResponse),
				},
			},
		},
	},
});

/**
 * Update a backup schedule
 */
export const updateBackupScheduleBody = type({
	repositoryId: "string?",
	enabled: "boolean?",
	cronExpression: "string?",
	retentionPolicy: retentionPolicySchema.optional(),
	excludePatterns: "string[]?",
	includePatterns: "string[]?",
	tags: "string[]?",
});

export type UpdateBackupScheduleBody = typeof updateBackupScheduleBody.infer;

export const updateBackupScheduleResponse = type({
	message: "string",
	schedule: backupScheduleSchema,
});

export const updateBackupScheduleDto = describeRoute({
	description: "Update a backup schedule",
	operationId: "updateBackupSchedule",
	tags: ["Backups"],
	responses: {
		200: {
			description: "Backup schedule updated successfully",
			content: {
				"application/json": {
					schema: resolver(updateBackupScheduleResponse),
				},
			},
		},
	},
});

/**
 * Delete a backup schedule
 */
export const deleteBackupScheduleResponse = type({
	message: "string",
});

export const deleteBackupScheduleDto = describeRoute({
	description: "Delete a backup schedule",
	operationId: "deleteBackupSchedule",
	tags: ["Backups"],
	responses: {
		200: {
			description: "Backup schedule deleted successfully",
			content: {
				"application/json": {
					schema: resolver(deleteBackupScheduleResponse),
				},
			},
		},
	},
});

/**
 * Run a backup immediately
 */
export const runBackupNowResponse = type({
	message: "string",
	backupStarted: "boolean",
});

export const runBackupNowDto = describeRoute({
	description: "Trigger a backup immediately for a schedule",
	operationId: "runBackupNow",
	tags: ["Backups"],
	responses: {
		200: {
			description: "Backup started successfully",
			content: {
				"application/json": {
					schema: resolver(runBackupNowResponse),
				},
			},
		},
	},
});
