import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

type ServerEventType =
	| "connected"
	| "heartbeat"
	| "backup:started"
	| "backup:completed"
	| "volume:mounted"
	| "volume:unmounted"
	| "volume:updated";

interface BackupEvent {
	scheduleId: number;
	volumeName: string;
	repositoryName: string;
	status?: "success" | "error";
}

interface VolumeEvent {
	volumeName: string;
}

type EventHandler = (data: unknown) => void;

/**
 * Hook to listen to Server-Sent Events (SSE) from the backend
 * Automatically handles cache invalidation for backup and volume events
 */
export function useServerEvents() {
	const queryClient = useQueryClient();
	const eventSourceRef = useRef<EventSource | null>(null);
	const handlersRef = useRef<Map<ServerEventType, Set<EventHandler>>>(new Map());

	useEffect(() => {
		const eventSource = new EventSource("/api/v1/events");
		eventSourceRef.current = eventSource;

		eventSource.addEventListener("connected", () => {
			console.log("[SSE] Connected to server events");
		});

		eventSource.addEventListener("heartbeat", () => {});

		eventSource.addEventListener("backup:started", (e) => {
			const data = JSON.parse(e.data) as BackupEvent;
			console.log("[SSE] Backup started:", data);

			handlersRef.current.get("backup:started")?.forEach((handler) => {
				handler(data);
			});
		});

		eventSource.addEventListener("backup:completed", (e) => {
			const data = JSON.parse(e.data) as BackupEvent;
			console.log("[SSE] Backup completed:", data);

			queryClient.invalidateQueries();
			queryClient.refetchQueries();

			handlersRef.current.get("backup:completed")?.forEach((handler) => {
				handler(data);
			});
		});

		eventSource.addEventListener("volume:mounted", (e) => {
			const data = JSON.parse(e.data) as VolumeEvent;
			console.log("[SSE] Volume mounted:", data);

			handlersRef.current.get("volume:mounted")?.forEach((handler) => {
				handler(data);
			});
		});

		eventSource.addEventListener("volume:unmounted", (e) => {
			const data = JSON.parse(e.data) as VolumeEvent;
			console.log("[SSE] Volume unmounted:", data);

			handlersRef.current.get("volume:unmounted")?.forEach((handler) => {
				handler(data);
			});
		});

		eventSource.addEventListener("volume:updated", (e) => {
			const data = JSON.parse(e.data) as VolumeEvent;
			console.log("[SSE] Volume updated:", data);

			queryClient.invalidateQueries();

			handlersRef.current.get("volume:updated")?.forEach((handler) => {
				handler(data);
			});
		});

		eventSource.onerror = (error) => {
			console.error("[SSE] Connection error:", error);
		};

		return () => {
			console.log("[SSE] Disconnecting from server events");
			eventSource.close();
			eventSourceRef.current = null;
		};
	}, [queryClient]);

	const addEventListener = (event: ServerEventType, handler: EventHandler) => {
		if (!handlersRef.current.has(event)) {
			handlersRef.current.set(event, new Set());
		}
		handlersRef.current.get(event)?.add(handler);

		return () => {
			handlersRef.current.get(event)?.delete(handler);
		};
	};

	return { addEventListener };
}
