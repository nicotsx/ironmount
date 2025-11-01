import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { Database, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { Volume } from "~/lib/types";
import {
	listRepositoriesOptions,
	upsertBackupScheduleMutation,
	getBackupScheduleForVolumeOptions,
	runBackupNowMutation,
} from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/lib/errors";
import { CreateScheduleForm, type BackupScheduleFormValues } from "../components/create-schedule-form";
import { ScheduleSummary } from "../components/schedule-summary";

type Props = {
	volume: Volume;
};

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

export const VolumeBackupsTabContent = ({ volume }: Props) => {
	const queryClient = useQueryClient();
	const [isEditMode, setIsEditMode] = useState(false);

	const { data: repositoriesData, isLoading: loadingRepositories } = useQuery({
		...listRepositoriesOptions(),
	});

	const { data: existingSchedule, isLoading: loadingSchedules } = useQuery({
		...getBackupScheduleForVolumeOptions({ path: { volumeId: volume.id.toString() } }),
	});

	const repositories = repositoriesData || [];

	const upsertSchedule = useMutation({
		...upsertBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Backup schedule saved successfully");
			queryClient.invalidateQueries({ queryKey: ["listBackupSchedules"] });
			queryClient.invalidateQueries({ queryKey: ["getBackupScheduleForVolume", volume.id.toString()] });
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
			queryClient.invalidateQueries({ queryKey: ["getBackupScheduleForVolume", volume.id.toString()] });
		},
		onError: (error) => {
			toast.error("Failed to start backup", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleSubmit = (formValues: BackupScheduleFormValues) => {
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
				volumeId: volume.id,
				repositoryId: formValues.repositoryId,
				enabled: existingSchedule?.enabled ?? true,
				cronExpression,
				retentionPolicy: Object.keys(retentionPolicy).length > 0 ? retentionPolicy : undefined,
			},
		});

		if (existingSchedule) {
			setIsEditMode(false);
		}
	};

	if (loadingRepositories || loadingSchedules) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<p className="text-muted-foreground">Loading...</p>
				</CardContent>
			</Card>
		);
	}

	if (repositories.length === 0) {
		return (
			<Card>
				<CardContent className="py-16">
					<div className="flex flex-col items-center justify-center text-center">
						<div className="relative mb-6">
							<div className="absolute inset-0 animate-pulse">
								<div className="w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
							</div>
							<div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
								<Database className="w-12 h-12 text-primary/70" strokeWidth={1.5} />
							</div>
						</div>
						<h3 className="text-xl font-semibold mb-2">No repositories available</h3>
						<p className="text-muted-foreground text-sm mb-6 max-w-md">
							To schedule automated backups, you need to create a repository first. Repositories are secure storage
							locations where your backups will be stored.
						</p>
						<Button>
							<Link to="/repositories" className="flex items-center">
								<Plus className="h-4 w-4 mr-2" />
								Create a repository
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	const handleToggleEnabled = (enabled: boolean) => {
		if (!existingSchedule) return;

		upsertSchedule.mutate({
			body: {
				volumeId: existingSchedule.volumeId,
				repositoryId: existingSchedule.repositoryId,
				enabled,
				cronExpression: existingSchedule.cronExpression,
				retentionPolicy: existingSchedule.retentionPolicy || undefined,
			},
		});
	};

	const handleRunBackupNow = () => {
		if (!existingSchedule) return;

		runBackupNow.mutate({
			path: {
				scheduleId: existingSchedule.id.toString(),
			},
		});
	};

	const repository = repositories.find((repo) => repo.id === existingSchedule?.repositoryId);

	if (existingSchedule && repository && !isEditMode) {
		return (
			<ScheduleSummary
				handleToggleEnabled={handleToggleEnabled}
				handleRunBackupNow={handleRunBackupNow}
				repository={repository}
				setIsEditMode={setIsEditMode}
				schedule={existingSchedule}
				volume={volume}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{existingSchedule && isEditMode && (
				<div className="flex justify-end">
					<Button variant="outline" onClick={() => setIsEditMode(false)}>
						Cancel
					</Button>
				</div>
			)}
			<CreateScheduleForm volume={volume} initialValues={existingSchedule ?? undefined} onSubmit={handleSubmit} />
		</div>
	);
};
