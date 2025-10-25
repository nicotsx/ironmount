import { Hono } from "hono";
import { validator } from "hono-openapi";
import {
	createBackupScheduleBody,
	createBackupScheduleDto,
	deleteBackupScheduleDto,
	getBackupScheduleDto,
	listBackupSchedulesDto,
	runBackupNowDto,
	updateBackupScheduleBody,
	updateBackupScheduleDto,
} from "./backups.dto";
import { backupsService } from "./backups.service";

export const backupScheduleController = new Hono()
	.get("/", listBackupSchedulesDto, async (c) => {
		const schedules = await backupsService.listSchedules();

		return c.json({ schedules }, 200);
	})
	.get("/:scheduleId", getBackupScheduleDto, async (c) => {
		const scheduleId = c.req.param("scheduleId");

		const schedule = await backupsService.getSchedule(Number(scheduleId));

		return c.json({ schedule }, 200);
	})
	.post("/", createBackupScheduleDto, validator("json", createBackupScheduleBody), async (c) => {
		const body = c.req.valid("json");

		const schedule = await backupsService.createSchedule(body);

		return c.json({ message: "Backup schedule created successfully", schedule }, 201);
	})
	.patch("/:scheduleId", updateBackupScheduleDto, validator("json", updateBackupScheduleBody), async (c) => {
		const scheduleId = c.req.param("scheduleId");
		const body = c.req.valid("json");

		const schedule = await backupsService.updateSchedule(Number(scheduleId), body);

		return c.json({ message: "Backup schedule updated successfully", schedule }, 200);
	})
	.delete("/:scheduleId", deleteBackupScheduleDto, async (c) => {
		const scheduleId = c.req.param("scheduleId");

		await backupsService.deleteSchedule(Number(scheduleId));

		return c.json({ message: "Backup schedule deleted successfully" }, 200);
	})
	.post("/:scheduleId/run", runBackupNowDto, async (c) => {
		const scheduleId = c.req.param("scheduleId");

		backupsService.executeBackup(Number(scheduleId)).catch((error) => {
			console.error("Backup execution failed:", error);
		});

		return c.json(
			{
				message: "Backup started",
				backupStarted: true,
			},
			200,
		);
	});
