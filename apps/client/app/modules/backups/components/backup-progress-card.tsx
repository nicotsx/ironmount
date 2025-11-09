import { useEffect, useState } from "react";
import { ByteSize, formatBytes } from "~/components/bytes-size";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { type BackupProgressEvent, useServerEvents } from "~/hooks/use-server-events";
import { formatDuration } from "~/utils/utils";

type Props = {
	scheduleId: number;
};

export const BackupProgressCard = ({ scheduleId }: Props) => {
	const { addEventListener } = useServerEvents();
	const [progress, setProgress] = useState<BackupProgressEvent | null>(null);

	useEffect(() => {
		const unsubscribe = addEventListener("backup:progress", (data) => {
			const progressData = data as BackupProgressEvent;
			if (progressData.scheduleId === scheduleId) {
				setProgress(progressData);
			}
		});

		const unsubscribeComplete = addEventListener("backup:completed", (data) => {
			const completedData = data as { scheduleId: number };
			if (completedData.scheduleId === scheduleId) {
				setProgress(null);
			}
		});

		return () => {
			unsubscribe();
			unsubscribeComplete();
		};
	}, [addEventListener, scheduleId]);

	if (!progress) {
		return (
			<div className="rounded-lg border border-border bg-card p-4">
				<div className="flex items-center gap-2">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<span className="text-sm text-muted-foreground">Starting backup...</span>
				</div>
			</div>
		);
	}

	const percentDone = Math.round(progress.percent_done * 100);
	const currentFile = progress.current_files[0] || "";
	const fileName = currentFile.split("/").pop() || currentFile;
	const speed = formatBytes(progress.bytes_done / progress.seconds_elapsed);

	return (
		<Card className="p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<span className="font-medium">Backup in progress</span>
				</div>
				<span className="text-sm font-medium text-primary">{percentDone}%</span>
			</div>

			<Progress value={percentDone} className="h-2" />

			<div className="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p className="text-xs uppercase text-muted-foreground">Files</p>
					<p className="font-medium">
						{progress.files_done.toLocaleString()} / {progress.total_files.toLocaleString()}
					</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Data</p>
					<p className="font-medium">
						<ByteSize bytes={progress.bytes_done} /> / <ByteSize bytes={progress.total_bytes} />
					</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Elapsed</p>
					<p className="font-medium">{formatDuration(progress.seconds_elapsed)}</p>
				</div>
				<div>
					<p className="text-xs uppercase text-muted-foreground">Speed</p>
					<p className="font-medium">
						{progress.seconds_elapsed > 0 ? `${speed.text} ${speed.unit}/s` : "Calculating..."}
					</p>
				</div>
			</div>

			{fileName && (
				<div className="pt-2 border-t border-border">
					<p className="text-xs uppercase text-muted-foreground mb-1">Current file</p>
					<p className="text-xs font-mono text-muted-foreground truncate" title={currentFile}>
						{fileName}
					</p>
				</div>
			)}
		</Card>
	);
};
