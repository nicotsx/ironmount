import { eq } from "drizzle-orm";
import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";
import { NotFoundError, BadRequestError } from "http-errors-enhanced";
import { db } from "../../db/db";
import { backupSchedulesTable, repositoriesTable, volumesTable } from "../../db/schema";
import { restic } from "../../utils/restic";
import { logger } from "../../utils/logger";
import { getVolumePath } from "../volumes/helpers";
import type { CreateBackupScheduleBody, UpdateBackupScheduleBody } from "./backups.dto";
import { toMessage } from "../../utils/errors";

const calculateNextRun = (cronExpression: string): Date => {
	try {
		const interval = CronExpressionParser.parse(cronExpression, {
			currentDate: new Date(),
			tz: "UTC",
		});

		return interval.next().toDate();
	} catch (error) {
		logger.error(`Failed to parse cron expression "${cronExpression}": ${error}`);
		const fallback = new Date();
		fallback.setMinutes(fallback.getMinutes() + 1);
		return fallback;
	}
};

const listSchedules = async () => {
	const schedules = await db.query.backupSchedulesTable.findMany({});
	return schedules;
};

const getSchedule = async (scheduleId: number) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(volumesTable.id, scheduleId),
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

	const existingSchedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.volumeId, data.volumeId),
	});

	if (existingSchedule) {
		throw new BadRequestError("Volume already has a backup schedule");
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

	if (data.repositoryId) {
		const repository = await db.query.repositoriesTable.findFirst({
			where: eq(repositoriesTable.id, data.repositoryId),
		});

		if (!repository) {
			throw new NotFoundError("Repository not found");
		}
	}

	const cronExpression = data.cronExpression ?? schedule.cronExpression;
	const nextBackupAt = data.cronExpression ? calculateNextRun(cronExpression) : schedule.nextBackupAt;

	const [updated] = await db
		.update(backupSchedulesTable)
		.set({ ...data, nextBackupAt, updatedAt: new Date() })
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

const executeBackup = async (scheduleId: number) => {
	const schedule = await db.query.backupSchedulesTable.findFirst({
		where: eq(backupSchedulesTable.id, scheduleId),
	});

	if (!schedule) {
		throw new NotFoundError("Backup schedule not found");
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

	try {
		const volumePath = getVolumePath(volume.name);

		const backupOptions: {
			exclude?: string[];
			include?: string[];
			tags?: string[];
		} = {};

		if (schedule.excludePatterns && schedule.excludePatterns.length > 0) {
			backupOptions.exclude = schedule.excludePatterns;
		}

		if (schedule.includePatterns && schedule.includePatterns.length > 0) {
			backupOptions.include = schedule.includePatterns;
		}

		await restic.backup(repository.config, volumePath, backupOptions);

		if (schedule.retentionPolicy) {
			await restic.forget(repository.config, schedule.retentionPolicy);
		}

		const nextBackupAt = calculateNextRun(schedule.cronExpression);
		await db
			.update(backupSchedulesTable)
			.set({
				lastBackupAt: new Date(),
				lastBackupStatus: "success",
				lastBackupError: null,
				nextBackupAt: nextBackupAt,
				updatedAt: new Date(),
			})
			.where(eq(backupSchedulesTable.id, scheduleId));

		logger.info(`Backup completed successfully for volume ${volume.name} to repository ${repository.name}`);
	} catch (error) {
		logger.error(`Backup failed for volume ${volume.name} to repository ${repository.name}: ${toMessage(error)}`);

		await db
			.update(backupSchedulesTable)
			.set({
				lastBackupAt: new Date(),
				lastBackupStatus: "error",
				lastBackupError: toMessage(error),
				updatedAt: new Date(),
			})
			.where(eq(backupSchedulesTable.id, scheduleId));

		throw error;
	}
};

const getSchedulesToExecute = async () => {
	const now = new Date();
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

export const backupsService = {
	listSchedules,
	getSchedule,
	createSchedule,
	updateSchedule,
	deleteSchedule,
	executeBackup,
	getSchedulesToExecute,
};
