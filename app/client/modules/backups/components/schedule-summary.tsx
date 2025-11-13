import { Pencil, Play, Square, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { OnOff } from "~/client/components/onoff";
import { Button } from "~/client/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/client/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/client/components/ui/alert-dialog";
import type { BackupSchedule } from "~/client/lib/types";
import { BackupProgressCard } from "./backup-progress-card";

type Props = {
	schedule: BackupSchedule;
	handleToggleEnabled: (enabled: boolean) => void;
	handleRunBackupNow: () => void;
	handleStopBackup: () => void;
	handleDeleteSchedule: () => void;
	setIsEditMode: (isEdit: boolean) => void;
};

export const ScheduleSummary = (props: Props) => {
	const { schedule, handleToggleEnabled, handleRunBackupNow, handleStopBackup, handleDeleteSchedule, setIsEditMode } =
		props;
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const summary = useMemo(() => {
		const scheduleLabel = schedule ? schedule.cronExpression : "-";

		const retentionParts: string[] = [];
		if (schedule?.retentionPolicy) {
			const rp = schedule.retentionPolicy;
			if (rp.keepLast) retentionParts.push(`${rp.keepLast} last`);
			if (rp.keepHourly) retentionParts.push(`${rp.keepHourly} hourly`);
			if (rp.keepDaily) retentionParts.push(`${rp.keepDaily} daily`);
			if (rp.keepWeekly) retentionParts.push(`${rp.keepWeekly} weekly`);
			if (rp.keepMonthly) retentionParts.push(`${rp.keepMonthly} monthly`);
			if (rp.keepYearly) retentionParts.push(`${rp.keepYearly} yearly`);
		}

		return {
			vol: schedule.volume.name,
			scheduleLabel,
			repositoryLabel: schedule.repositoryId || "No repository selected",
			retentionLabel: retentionParts.length > 0 ? retentionParts.join(" • ") : "No retention policy",
		};
	}, [schedule, schedule.volume.name]);

	const handleConfirmDelete = () => {
		setShowDeleteConfirm(false);
		handleDeleteSchedule();
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<CardTitle>Backup schedule</CardTitle>
							<CardDescription>
								Automated backup configuration for volume&nbsp;
								<strong className="text-strong-accent">{schedule.volume.name}</strong>
							</CardDescription>
						</div>
						<div className="flex items-center gap-2 justify-between sm:justify-start">
							<OnOff
								isOn={schedule.enabled}
								toggle={handleToggleEnabled}
								enabledLabel="Enabled"
								disabledLabel="Paused"
							/>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row gap-2">
						{schedule.lastBackupStatus === "in_progress" ? (
							<Button variant="destructive" size="sm" onClick={handleStopBackup} className="w-full sm:w-auto">
								<Square className="h-4 w-4 mr-2" />
								<span className="sm:inline">Stop backup</span>
							</Button>
						) : (
							<Button variant="default" size="sm" onClick={handleRunBackupNow} className="w-full sm:w-auto">
								<Play className="h-4 w-4 mr-2" />
								<span className="sm:inline">Backup now</span>
							</Button>
						)}
						<Button variant="outline" size="sm" onClick={() => setIsEditMode(true)} className="w-full sm:w-auto">
							<Pencil className="h-4 w-4 mr-2" />
							<span className="sm:inline">Edit schedule</span>
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowDeleteConfirm(true)}
							className="text-destructive hover:text-destructive w-full sm:w-auto"
						>
							<Trash2 className="h-4 w-4 mr-2" />
							<span className="sm:inline">Delete</span>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<div>
						<p className="text-xs uppercase text-muted-foreground">Schedule</p>
						<p className="font-medium">{summary.scheduleLabel}</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Repository</p>
						<p className="font-medium">{schedule.repository.name}</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Last backup</p>
						<p className="font-medium">
							{schedule.lastBackupAt ? new Date(schedule.lastBackupAt).toLocaleString() : "Never"}
						</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Next backup</p>
						<p className="font-medium">
							{schedule.nextBackupAt ? new Date(schedule.nextBackupAt).toLocaleString() : "Never"}
						</p>
					</div>

					<div>
						<p className="text-xs uppercase text-muted-foreground">Status</p>
						<p className="font-medium">
							{schedule.lastBackupStatus === "success" && "✓ Success"}
							{schedule.lastBackupStatus === "error" && "✗ Error"}
							{schedule.lastBackupStatus === "in_progress" && "⟳  in progress..."}
							{!schedule.lastBackupStatus && "—"}
						</p>
					</div>

					{schedule.lastBackupError && (
						<div className="md:col-span-2 lg:col-span-4">
							<p className="text-xs uppercase text-muted-foreground">Error Details</p>
							<p className="font-mono text-sm text-red-600 whitespace-pre-wrap break-all">{schedule.lastBackupError}</p>
						</div>
					)}
				</CardContent>
			</Card>

			{schedule.lastBackupStatus === "in_progress" && <BackupProgressCard scheduleId={schedule.id} />}

			<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete backup schedule?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this backup schedule for <strong>{schedule.volume.name}</strong>? This
							action cannot be undone. Existing snapshots will not be deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex gap-3 justify-end">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete schedule
						</AlertDialogAction>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};
