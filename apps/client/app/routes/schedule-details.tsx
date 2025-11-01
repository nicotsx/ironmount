import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	upsertBackupScheduleMutation,
	getBackupScheduleOptions,
	runBackupNowMutation,
} from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/lib/errors";
import { CreateScheduleForm, type BackupScheduleFormValues } from "~/modules/details/components/create-schedule-form";
import { ScheduleSummary } from "~/modules/details/components/schedule-summary";

const getCronExpression = (frequency: string, dailyTime?: string, weeklyDay?: string): string => {
	if (frequency === "hourly") {
		return "0 * * * *";
	}

	if (!dailyTime) {
		dailyTime = "02:00";
	}

	const [hours, minutes] = dailyTime.split(":");

	if (frequency === "daily") {
		return `${minutes} ${hours} * * *`;
	}

	return `${minutes} ${hours} * * ${weeklyDay ?? "0"}`;
};

export default function ScheduleDetailsPage() {
	const { scheduleId } = useParams<{ scheduleId: string }>();
	const queryClient = useQueryClient();
	const [isEditMode, setIsEditMode] = useState(false);

	const { data: schedule, isLoading: loadingSchedule } = useQuery({
		...getBackupScheduleOptions({
			path: { scheduleId: scheduleId || "" },
		}),
	});

	console.log("Schedule Details:", schedule);

	const upsertSchedule = useMutation({
		...upsertBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Backup schedule saved successfully");
			queryClient.invalidateQueries({ queryKey: ["listBackupSchedules"] });
			queryClient.invalidateQueries({ queryKey: ["getBackupSchedule", scheduleId] });
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
			queryClient.invalidateQueries({ queryKey: ["getBackupSchedule", scheduleId] });
		},
		onError: (error) => {
			toast.error("Failed to start backup", {
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
			<div className="container mx-auto p-4 sm:p-8">
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">Schedule not found</p>
						<Button asChild className="mt-4">
							<Link to="/backup-jobs">Back to Backup Jobs</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!isEditMode) {
		return (
			<div className="container mx-auto p-4 sm:p-8">
				<ScheduleSummary
					handleToggleEnabled={handleToggleEnabled}
					handleRunBackupNow={handleRunBackupNow}
					repository={schedule.repository}
					setIsEditMode={setIsEditMode}
					schedule={schedule}
					volume={schedule.volume}
				/>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 sm:p-8 space-y-4">
			<div className="flex justify-end">
				<Button variant="outline" onClick={() => setIsEditMode(false)}>
					Cancel
				</Button>
			</div>
			<CreateScheduleForm volume={schedule.volume} initialValues={schedule} onSubmit={handleSubmit} />
		</div>
	);
}
