import { Hono } from "hono";
import { validator } from "hono-openapi";
import {
	createBackupScheduleBody,
	createBackupScheduleDto,
	deleteBackupScheduleDto,
	getBackupScheduleDto,
	getBackupScheduleForVolumeDto,
	listBackupSchedulesDto,
	runBackupNowDto,
	updateBackupScheduleDto,
	updateBackupScheduleBody,
	type CreateBackupScheduleDto,
	type DeleteBackupScheduleDto,
	type GetBackupScheduleDto,
	type GetBackupScheduleForVolumeResponseDto,
	type ListBackupSchedulesResponseDto,
	type RunBackupNowDto,
	type UpdateBackupScheduleDto,
} from "./backups.dto";
import { backupsService } from "./backups.service";

export const backupScheduleController = new Hono()
	.get("/", listBackupSchedulesDto, async (c) => {
		const schedules = await backupsService.listSchedules();

		return c.json<ListBackupSchedulesResponseDto>(schedules, 200);
	})
	.get("/:scheduleId", getBackupScheduleDto, async (c) => {
		const scheduleId = c.req.param("scheduleId");

		const schedule = await backupsService.getSchedule(Number(scheduleId));

		return c.json<GetBackupScheduleDto>(schedule, 200);
	})
	.get("/volume/:volumeId", getBackupScheduleForVolumeDto, async (c) => {
		const volumeId = c.req.param("volumeId");
		const schedule = await backupsService.getScheduleForVolume(Number(volumeId));

		return c.json<GetBackupScheduleForVolumeResponseDto>(schedule, 200);
	})
	.post("/", createBackupScheduleDto, validator("json", createBackupScheduleBody), async (c) => {
		const body = c.req.valid("json");

		const schedule = await backupsService.createSchedule(body);

		return c.json<CreateBackupScheduleDto>(schedule, 201);
	})
	.patch("/:scheduleId", updateBackupScheduleDto, validator("json", updateBackupScheduleBody), async (c) => {
		const scheduleId = c.req.param("scheduleId");
		const body = c.req.valid("json");

		const schedule = await backupsService.updateSchedule(Number(scheduleId), body);

		return c.json<UpdateBackupScheduleDto>(schedule, 200);
	})
	.delete("/:scheduleId", deleteBackupScheduleDto, async (c) => {
		const scheduleId = c.req.param("scheduleId");

		await backupsService.deleteSchedule(Number(scheduleId));

		return c.json<DeleteBackupScheduleDto>({ success: true }, 200);
	})
	.post("/:scheduleId/run", runBackupNowDto, async (c) => {
		const scheduleId = c.req.param("scheduleId");

		backupsService.executeBackup(Number(scheduleId), true).catch((error) => {
			console.error("Backup execution failed:", error);
		});

		return c.json<RunBackupNowDto>({ success: true }, 200);
	});
