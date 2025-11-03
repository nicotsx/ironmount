import { useId, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { redirect, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	upsertBackupScheduleMutation,
	getBackupScheduleOptions,
	runBackupNowMutation,
	deleteBackupScheduleMutation,
	listSnapshotsOptions,
} from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/lib/errors";
import { getCronExpression } from "~/utils/utils";
import { CreateScheduleForm, type BackupScheduleFormValues } from "../components/create-schedule-form";
import { ScheduleSummary } from "../components/schedule-summary";
import { getBackupSchedule, listSnapshots } from "~/api-client";
import type { Route } from "./+types/backup-details";
import { SnapshotFileBrowser } from "../components/snapshot-file-browser";
import { SnapshotTimeline } from "../components/snapshot-timeline";

export const clientLoader = async ({ params }: Route.LoaderArgs) => {
	const { data } = await getBackupSchedule({ path: { scheduleId: params.id } });

	if (!data) return redirect("/backups");

	const snapshots = await listSnapshots({
		path: { name: data.repository.name },
		query: { volumeId: data.volumeId.toString() },
	});

	if (snapshots.data) return { snapshots: snapshots.data, schedule: data };
	return { snapshots: [], schedule: data };
};

export default function ScheduleDetailsPage({ params, loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();
	const [isEditMode, setIsEditMode] = useState(false);
	const formId = useId();
	const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(loaderData.snapshots.at(-1)?.short_id ?? "");

	const { data: schedule } = useQuery({
		...getBackupScheduleOptions({
			path: { scheduleId: params.id },
		}),
		initialData: loaderData.schedule,
	});

	const { data: snapshots } = useQuery({
		...listSnapshotsOptions({
			path: { name: schedule.repository.name },
			query: { volumeId: schedule.volumeId.toString() },
		}),
		initialData: loaderData.snapshots,
	});

	const upsertSchedule = useMutation({
		...upsertBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Backup schedule saved successfully");
			setIsEditMode(false);
		},
		onError: (error) => {
			toast.error("Failed to save backup schedule", {
				description: parseError(error)?.message,
			});
		},
	});

	const runBackupNow = useMutation({
		...runBackupNowMutation(),
		onSuccess: () => {
			toast.success("Backup started successfully");
		},
		onError: (error) => {
			toast.error("Failed to start backup", {
				description: parseError(error)?.message,
			});
		},
	});

	const deleteSchedule = useMutation({
		...deleteBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Backup schedule deleted successfully");
			navigate("/backups");
		},
		onError: (error) => {
			toast.error("Failed to delete backup schedule", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleSubmit = (formValues: BackupScheduleFormValues) => {
		if (!schedule) return;

		const cronExpression = getCronExpression(formValues.frequency, formValues.dailyTime, formValues.weeklyDay);

		const retentionPolicy: Record<string, number> = {};
		if (formValues.keepLast) retentionPolicy.keepLast = formValues.keepLast;
		if (formValues.keepHourly) retentionPolicy.keepHourly = formValues.keepHourly;
		if (formValues.keepDaily) retentionPolicy.keepDaily = formValues.keepDaily;
		if (formValues.keepWeekly) retentionPolicy.keepWeekly = formValues.keepWeekly;
		if (formValues.keepMonthly) retentionPolicy.keepMonthly = formValues.keepMonthly;
		if (formValues.keepYearly) retentionPolicy.keepYearly = formValues.keepYearly;

		upsertSchedule.mutate({
			body: {
				volumeId: schedule.volumeId,
				repositoryId: formValues.repositoryId,
				enabled: schedule.enabled,
				cronExpression,
				retentionPolicy: Object.keys(retentionPolicy).length > 0 ? retentionPolicy : undefined,
				includePatterns: formValues.includePatterns,
				excludePatterns: formValues.excludePatterns,
			},
		});
	};

	const handleToggleEnabled = (enabled: boolean) => {
		if (!schedule) return;

		upsertSchedule.mutate({
			body: {
				volumeId: schedule.volumeId,
				repositoryId: schedule.repositoryId,
				enabled,
				cronExpression: schedule.cronExpression,
				retentionPolicy: schedule.retentionPolicy || undefined,
				includePatterns: schedule.includePatterns || undefined,
				excludePatterns: schedule.excludePatterns || undefined,
			},
		});
	};

	const handleRunBackupNow = () => {
		if (!schedule) return;

		runBackupNow.mutate({
			path: {
				scheduleId: schedule.id.toString(),
			},
		});
	};

	const handleDeleteSchedule = () => {
		if (!schedule) return;

		deleteSchedule.mutate({ path: { scheduleId: schedule.id.toString() } });
	};

	if (isEditMode) {
		return (
			<div>
				<CreateScheduleForm volume={schedule.volume} initialValues={schedule} onSubmit={handleSubmit} formId={formId} />
				<div className="flex justify-end mt-4 gap-2">
					<Button type="submit" className="ml-auto" variant="primary" form={formId} loading={upsertSchedule.isPending}>
						Update schedule
					</Button>
					<Button variant="outline" onClick={() => setIsEditMode(false)}>
						Cancel
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<ScheduleSummary
				handleToggleEnabled={handleToggleEnabled}
				handleRunBackupNow={handleRunBackupNow}
				handleDeleteSchedule={handleDeleteSchedule}
				setIsEditMode={setIsEditMode}
				schedule={schedule}
			/>

			<SnapshotTimeline
				snapshots={snapshots}
				snapshotId={selectedSnapshotId}
				onSnapshotSelect={setSelectedSnapshotId}
			/>

			<SnapshotFileBrowser
				snapshots={snapshots}
				repositoryName={schedule.repository.name}
				snapshotId={selectedSnapshotId}
			/>
		</div>
	);
}
