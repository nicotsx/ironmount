import { eq } from "drizzle-orm";
import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";
import { NotFoundError, BadRequestError, ConflictError } from "http-errors-enhanced";
import { db } from "../../db/db";
import { backupSchedulesTable, repositoriesTable, volumesTable } from "../../db/schema";
import { restic } from "../../utils/restic";
import { logger } from "../../utils/logger";
import { createVolumeBackend } from "../backends/backend";
import type { CreateBackupScheduleBody, UpdateBackupScheduleBody } from "./backups.dto";
import { toMessage } from "../../utils/errors";
import { serverEvents } from "../../core/events";

const runningBackups = new Map<number, AbortController>();

const calculateNextRun = (cronExpression: string): number => {
	try {
		const interval = CronExpressionParser.parse(cronExpression, {
			currentDate: new Date(),
			tz: "UTC",
		});

		return interval.next().getTime();
	} catch (error) {
		logger.error(`Failed to parse cron expression "${cronExpression}": ${error}`);
		const fallback = new Date();
		fallback.setMinutes(fallback.getMinutes() + 1);
		return fallback.getTime();
	}
};

const listSchedules = async () => {
	const schedules = await db.query.backupSchedulesTable.findMany({
		with: {
			volume: true,
			repository: true,
		},
	});
	return schedules;
};

const getSchedule = async (scheduleId: number) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(volumesTable.id, scheduleId),
		with: {
			volume: true,
			repository: true,
		},
	});

	if (!schedule) {
		throw new NotFoundError("Backup schedule not found");
	}

	return schedule;
};

const createSchedule = async (data: CreateBackupScheduleBody) => {
	if (!cron.validate(data.cronExpression)) {
		throw new BadRequestError("Invalid cron expression");
	}

	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.id, data.volumeId),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.id, data.repositoryId),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	const nextBackupAt = calculateNextRun(data.cronExpression);

	const [newSchedule] = await db
		.insert(backupSchedulesTable)
		.values({
			volumeId: data.volumeId,
			repositoryId: data.repositoryId,
			enabled: data.enabled,
			cronExpression: data.cronExpression,
			retentionPolicy: data.retentionPolicy ?? null,
			excludePatterns: data.excludePatterns ?? [],
			includePatterns: data.includePatterns ?? [],
			nextBackupAt: nextBackupAt,
		})
		.returning();

	if (!newSchedule) {
		throw new Error("Failed to create backup schedule");
	}

	return newSchedule;
};

const updateSchedule = async (scheduleId: number, data: UpdateBackupScheduleBody) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.id, scheduleId),
	});

	if (!schedule) {
		throw new NotFoundError("Backup schedule not found");
	}

	if (data.cronExpression && !cron.validate(data.cronExpression)) {
		throw new BadRequestError("Invalid cron expression");
	}

	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.id, data.repositoryId),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	const cronExpression = data.cronExpression ?? schedule.cronExpression;
	const nextBackupAt = data.cronExpression ? calculateNextRun(cronExpression) : schedule.nextBackupAt;

	const [updated] = await db
		.update(backupSchedulesTable)
		.set({ ...data, nextBackupAt, updatedAt: Date.now() })
		.where(eq(backupSchedulesTable.id, scheduleId))
		.returning();

	if (!updated) {
		throw new Error("Failed to update backup schedule");
	}

	return updated;
};

const deleteSchedule = async (scheduleId: number) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.id, scheduleId),
	});

	if (!schedule) {
		throw new NotFoundError("Backup schedule not found");
	}

	await db.delete(backupSchedulesTable).where(eq(backupSchedulesTable.id, scheduleId));
};

const executeBackup = async (scheduleId: number, manual = false) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.id, scheduleId),
	});

	if (!schedule) {
		throw new NotFoundError("Backup schedule not found");
	}

	if (!schedule.enabled && !manual) {
		logger.info(`Backup schedule ${scheduleId} is disabled. Skipping execution.`);
		return;
	}

	if (schedule.lastBackupStatus === "in_progress") {
		logger.info(`Backup schedule ${scheduleId} is already in progress. Skipping execution.`);
		return;
	}

	const volume = await db.query.volumesTable.findFirst({
		where: eq(volumesTable.id, schedule.volumeId),
	});

	if (!volume) {
		throw new NotFoundError("Volume not found");
	}

	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.id, schedule.repositoryId),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	if (volume.status !== "mounted") {
		throw new BadRequestError("Volume is not mounted");
	}

	logger.info(`Starting backup for volume ${volume.name} to repository ${repository.name}`);

	serverEvents.emit("backup:started", {
		scheduleId,
		volumeName: volume.name,
		repositoryName: repository.name,
	});

	const nextBackupAt = calculateNextRun(schedule.cronExpression);

	await db
		.update(backupSchedulesTable)
		.set({ lastBackupStatus: "in_progress", updatedAt: Date.now(), lastBackupError: null, nextBackupAt })
		.where(eq(backupSchedulesTable.id, scheduleId));

	const abortController = new AbortController();
	runningBackups.set(scheduleId, abortController);

	try {
		const backend = createVolumeBackend(volume);
		const backupPath = await backend.getBackupPath();

		const backupOptions: {
			exclude?: string[];
			include?: string[];
			tags?: string[];
			signal?: AbortSignal;
		} = {
			tags: [schedule.id.toString()],
			signal: abortController.signal,
		};

		if (schedule.excludePatterns && schedule.excludePatterns.length > 0) {
			backupOptions.exclude = schedule.excludePatterns;
		}

		if (schedule.includePatterns && schedule.includePatterns.length > 0) {
			backupOptions.include = schedule.includePatterns;
		}

		await restic.backup(repository.config, backupPath, {
			...backupOptions,
			onProgress: (progress) => {
				serverEvents.emit("backup:progress", {
					scheduleId,
					volumeName: volume.name,
					repositoryName: repository.name,
					...progress,
				});
			},
		});

		if (schedule.retentionPolicy) {
			await restic.forget(repository.config, schedule.retentionPolicy, { tag: schedule.id.toString() });
		}

		const nextBackupAt = calculateNextRun(schedule.cronExpression);
		await db
			.update(backupSchedulesTable)
			.set({
				lastBackupAt: Date.now(),
				lastBackupStatus: "success",
				lastBackupError: null,
				nextBackupAt: nextBackupAt,
				updatedAt: Date.now(),
			})
			.where(eq(backupSchedulesTable.id, scheduleId));

		logger.info(`Backup completed successfully for volume ${volume.name} to repository ${repository.name}`);

		serverEvents.emit("backup:completed", {
			scheduleId,
			volumeName: volume.name,
			repositoryName: repository.name,
			status: "success",
		});
	} catch (error) {
		logger.error(`Backup failed for volume ${volume.name} to repository ${repository.name}: ${toMessage(error)}`);

		await db
			.update(backupSchedulesTable)
			.set({
				lastBackupAt: Date.now(),
				lastBackupStatus: "error",
				lastBackupError: toMessage(error),
				updatedAt: Date.now(),
			})
			.where(eq(backupSchedulesTable.id, scheduleId));

		serverEvents.emit("backup:completed", {
			scheduleId,
			volumeName: volume.name,
			repositoryName: repository.name,
			status: "error",
		});

		throw error;
	} finally {
		runningBackups.delete(scheduleId);
	}
};

const getSchedulesToExecute = async () => {
	const now = Date.now();
	const schedules = await db.query.backupSchedulesTable.findMany({
		where: eq(backupSchedulesTable.enabled, true),
	});

	const schedulesToRun: number[] = [];

	for (const schedule of schedules) {
		if (!schedule.nextBackupAt || schedule.nextBackupAt <= now) {
			schedulesToRun.push(schedule.id);
		}
	}

	return schedulesToRun;
};

const getScheduleForVolume = async (volumeId: number) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.volumeId, volumeId),
		with: { volume: true, repository: true },
	});

	return schedule ?? null;
};

const stopBackup = async (scheduleId: number) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.id, scheduleId),
	});

	if (!schedule) {
		throw new NotFoundError("Backup schedule not found");
	}

	await db
		.update(backupSchedulesTable)
		.set({
			lastBackupStatus: "error",
			lastBackupError: "Backup was stopped by user",
			updatedAt: Date.now(),
		})
		.where(eq(backupSchedulesTable.id, scheduleId));

	const abortController = runningBackups.get(scheduleId);
	if (!abortController) {
		throw new ConflictError("No backup is currently running for this schedule");
	}

	logger.info(`Stopping backup for schedule ${scheduleId}`);

	abortController.abort();
};

const runForget = async (scheduleId: number) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.id, scheduleId),
	});

	if (!schedule) {
		throw new NotFoundError("Backup schedule not found");
	}

	if (!schedule.retentionPolicy) {
		throw new BadRequestError("No retention policy configured for this schedule");
	}

	const repository = await db.query.repositoriesTable.findFirst({
		where: eq(repositoriesTable.id, schedule.repositoryId),
	});

	if (!repository) {
		throw new NotFoundError("Repository not found");
	}

	logger.info(`Manually running retention policy (forget) for schedule ${scheduleId}`);
	await restic.forget(repository.config, schedule.retentionPolicy, { tag: schedule.id.toString() });
	logger.info(`Retention policy applied successfully for schedule ${scheduleId}`);
};

export const backupsService = {
	listSchedules,
	getSchedule,
	createSchedule,
	updateSchedule,
	deleteSchedule,
	executeBackup,
	getSchedulesToExecute,
	getScheduleForVolume,
	stopBackup,
	runForget,
};
