import { type } from "arktype";
import { describeRoute, resolver } from "hono-openapi";
import { volumeSchema } from "../volumes/volume.dto";
import { repositorySchema } from "../repositories/repositories.dto";

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
	repositoryId: "string",
	enabled: "boolean",
	cronExpression: "string",
	retentionPolicy: retentionPolicySchema.or("null"),
	excludePatterns: "string[] | null",
	includePatterns: "string[] | null",
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
export const listBackupSchedulesResponse = backupScheduleSchema.array();

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
export const getBackupScheduleResponse = backupScheduleSchema.and(
	type({
		volume: volumeSchema,
		repository: repositorySchema,
	}),
);

export type GetBackupScheduleDto = typeof getBackupScheduleResponse.infer;

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

export const getBackupScheduleForVolumeResponse = backupScheduleSchema.or("null");

export type GetBackupScheduleForVolumeResponseDto = typeof getBackupScheduleForVolumeResponse.infer;

export const getBackupScheduleForVolumeDto = describeRoute({
	description: "Get a backup schedule for a specific volume",
	tags: ["Backups"],
	operationId: "getBackupScheduleForVolume",
	responses: {
		200: {
			description: "Backup schedule details for the volume",
			content: {
				"application/json": {
					schema: resolver(getBackupScheduleForVolumeResponse),
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

export const createBackupScheduleResponse = backupScheduleSchema;

export type CreateBackupScheduleDto = typeof createBackupScheduleResponse.infer;

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

export const updateBackupScheduleResponse = backupScheduleSchema;

export type UpdateBackupScheduleDto = typeof updateBackupScheduleResponse.infer;

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
 * Upsert a backup schedule (create or update)
 */
export const upsertBackupScheduleBody = type({
	volumeId: "number",
	repositoryId: "string",
	enabled: "boolean",
	cronExpression: "string",
	retentionPolicy: retentionPolicySchema.optional(),
	excludePatterns: "string[]?",
	includePatterns: "string[]?",
	tags: "string[]?",
});

export type UpsertBackupScheduleBody = typeof upsertBackupScheduleBody.infer;

export const upsertBackupScheduleResponse = backupScheduleSchema;

export type UpsertBackupScheduleDto = typeof upsertBackupScheduleResponse.infer;

export const upsertBackupScheduleDto = describeRoute({
	description: "Create or update a backup schedule for a volume",
	operationId: "upsertBackupSchedule",
	tags: ["Backups"],
	responses: {
		200: {
			description: "Backup schedule upserted successfully",
			content: {
				"application/json": {
					schema: resolver(upsertBackupScheduleResponse),
				},
			},
		},
	},
});

/**
 * Delete a backup schedule
 */
export const deleteBackupScheduleResponse = type({
	success: "boolean",
});

export type DeleteBackupScheduleDto = typeof deleteBackupScheduleResponse.infer;

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
	success: "boolean",
});

export type RunBackupNowDto = typeof runBackupNowResponse.infer;

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
