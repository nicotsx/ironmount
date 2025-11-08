import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { logger } from "../../utils/logger";
import { serverEvents } from "../../core/events";

export const eventsController = new Hono().get("/", (c) => {
	logger.info("Client connected to SSE endpoint");

	return streamSSE(c, async (stream) => {
		await stream.writeSSE({
			data: JSON.stringify({ type: "connected", timestamp: Date.now() }),
			event: "connected",
		});

		const onBackupStarted = (data: { scheduleId: number; volumeName: string; repositoryName: string }) => {
			stream.writeSSE({
				data: JSON.stringify(data),
				event: "backup:started",
			});
		};

		const onBackupCompleted = (data: {
			scheduleId: number;
			volumeName: string;
			repositoryName: string;
			status: "success" | "error" | "stopped";
		}) => {
			stream.writeSSE({
				data: JSON.stringify(data),
				event: "backup:completed",
			});
		};

		const onVolumeMounted = (data: { volumeName: string }) => {
			stream.writeSSE({
				data: JSON.stringify(data),
				event: "volume:mounted",
			});
		};

		const onVolumeUnmounted = (data: { volumeName: string }) => {
			stream.writeSSE({
				data: JSON.stringify(data),
				event: "volume:unmounted",
			});
		};

		const onVolumeUpdated = (data: { volumeName: string }) => {
			stream.writeSSE({
				data: JSON.stringify(data),
				event: "volume:updated",
			});
		};

		serverEvents.on("backup:started", onBackupStarted);
		serverEvents.on("backup:completed", onBackupCompleted);
		serverEvents.on("volume:mounted", onVolumeMounted);
		serverEvents.on("volume:unmounted", onVolumeUnmounted);
		serverEvents.on("volume:updated", onVolumeUpdated);

		let keepAlive = true;

		stream.onAbort(() => {
			logger.info("Client disconnected from SSE endpoint");
			keepAlive = false;
			serverEvents.off("backup:started", onBackupStarted);
			serverEvents.off("backup:completed", onBackupCompleted);
			serverEvents.off("volume:mounted", onVolumeMounted);
			serverEvents.off("volume:unmounted", onVolumeUnmounted);
			serverEvents.off("volume:updated", onVolumeUpdated);
		});

		while (keepAlive) {
			await stream.writeSSE({
				data: JSON.stringify({ timestamp: Date.now() }),
				event: "heartbeat",
			});
			await stream.sleep(5000);
		}
	});
});
