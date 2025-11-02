import { useId, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	upsertBackupScheduleMutation,
	getBackupScheduleOptions,
	runBackupNowMutation,
	deleteBackupScheduleMutation,
} from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/lib/errors";
import { getCronExpression } from "~/utils/utils";
import { CreateScheduleForm, type BackupScheduleFormValues } from "../components/create-schedule-form";
import { ScheduleSummary } from "../components/schedule-summary";

export default function ScheduleDetailsPage() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [isEditMode, setIsEditMode] = useState(false);
	const formId = useId();

	const { data: schedule, isLoading: loadingSchedule } = useQuery({
		...getBackupScheduleOptions({
			path: { scheduleId: id || "" },
		}),
	});

	console.log("Schedule Details:", schedule);

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

	if (loadingSchedule && !schedule) {
		return (
			<div className="container mx-auto p-4 sm:p-8">
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">Loading...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!schedule) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<p className="text-muted-foreground">Not found</p>
					<Button className="mt-4">
						<Link to="/backups">Back to backups</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!isEditMode) {
		return (
			<ScheduleSummary
				handleToggleEnabled={handleToggleEnabled}
				handleRunBackupNow={handleRunBackupNow}
				handleDeleteSchedule={handleDeleteSchedule}
				repository={schedule.repository}
				setIsEditMode={setIsEditMode}
				schedule={schedule}
				volume={schedule.volume}
				isDeleting={deleteSchedule.isPending}
			/>
		);
	}

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
