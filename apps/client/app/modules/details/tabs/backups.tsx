import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { Database, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { OnOff } from "~/components/onoff";
import type { Volume } from "~/lib/types";
import {
	listRepositoriesOptions,
	createBackupScheduleMutation,
	updateBackupScheduleMutation,
	getBackupScheduleForVolumeOptions,
} from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/lib/errors";
import { CreateScheduleForm, type BackupScheduleFormValues } from "../components/create-schedule-form";

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

	const { data: repositoriesData, isLoading: loadingRepositories } = useQuery({
		...listRepositoriesOptions(),
	});

	const { data: existingSchedule, isLoading: loadingSchedules } = useQuery({
		...getBackupScheduleForVolumeOptions({ path: { volumeId: volume.id.toString() } }),
	});

	const [isEnabled, setIsEnabled] = useState(existingSchedule?.enabled ?? true);

	const repositories = repositoriesData || [];
	const selectedRepository = repositories.find((r) => r.id === (existingSchedule?.repositoryId ?? ""));

	const summary = useMemo(() => {
		const scheduleLabel = existingSchedule ? existingSchedule.cronExpression : "Every day at 02:00";

		const retentionParts: string[] = [];
		if (existingSchedule?.retentionPolicy) {
			const rp = existingSchedule.retentionPolicy;
			if (rp.keepLast) retentionParts.push(`${rp.keepLast} last`);
			if (rp.keepHourly) retentionParts.push(`${rp.keepHourly} hourly`);
			if (rp.keepDaily) retentionParts.push(`${rp.keepDaily} daily`);
			if (rp.keepWeekly) retentionParts.push(`${rp.keepWeekly} weekly`);
			if (rp.keepMonthly) retentionParts.push(`${rp.keepMonthly} monthly`);
			if (rp.keepYearly) retentionParts.push(`${rp.keepYearly} yearly`);
		}

		return {
			vol: volume.name,
			scheduleLabel,
			repositoryLabel: selectedRepository?.name || "No repository selected",
			retentionLabel: retentionParts.length > 0 ? retentionParts.join(" • ") : "No retention policy",
		};
	}, [existingSchedule, selectedRepository, volume.name]);

	const createSchedule = useMutation({
		...createBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Backup schedule created successfully");
			queryClient.invalidateQueries({ queryKey: ["listBackupSchedules"] });
		},
		onError: (error) => {
			toast.error("Failed to create backup schedule", {
				description: parseError(error)?.message,
			});
		},
	});

	const updateSchedule = useMutation({
		...updateBackupScheduleMutation(),
		onSuccess: () => {
			toast.success("Backup schedule updated successfully");
			queryClient.invalidateQueries({ queryKey: ["listBackupSchedules"] });
		},
		onError: (error) => {
			toast.error("Failed to update backup schedule", {
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

		if (existingSchedule) {
			updateSchedule.mutate({
				path: { scheduleId: existingSchedule.id.toString() },
				body: {
					repositoryId: formValues.repositoryId,
					enabled: isEnabled,
					cronExpression,
					retentionPolicy: Object.keys(retentionPolicy).length > 0 ? retentionPolicy : undefined,
				},
			});
		} else {
			createSchedule.mutate({
				body: {
					volumeId: volume.id,
					repositoryId: formValues.repositoryId,
					enabled: true,
					cronExpression,
					retentionPolicy: Object.keys(retentionPolicy).length > 0 ? retentionPolicy : undefined,
				},
			});
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
						<Button asChild>
							<Link to="/repositories">
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

		setIsEnabled(enabled);
		updateSchedule.mutate({
			path: { scheduleId: existingSchedule.id.toString() },
			body: {
				repositoryId: existingSchedule.repositoryId,
				enabled,
				cronExpression: existingSchedule.cronExpression,
				retentionPolicy: existingSchedule.retentionPolicy || undefined,
			},
		});
	};

	return (
		<CreateScheduleForm
			volume={volume}
			initialValues={existingSchedule ?? undefined}
			onSubmit={handleSubmit}
			summaryContent={
				existingSchedule ? (
					<Card className="h-full">
						<CardHeader className="flex flex-row items-center justify-between gap-4">
							<div>
								<CardTitle>Schedule summary</CardTitle>
								<CardDescription>Review the backup configuration.</CardDescription>
							</div>
							<OnOff isOn={isEnabled} toggle={handleToggleEnabled} enabledLabel="Enabled" disabledLabel="Paused" />
						</CardHeader>
						<CardContent className="flex flex-col gap-4 text-sm">
							<div>
								<p className="text-xs uppercase text-muted-foreground">Volume</p>
								<p className="font-medium">{summary.vol}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Schedule</p>
								<p className="font-medium">{summary.scheduleLabel}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Repository</p>
								<p className="font-medium">{summary.repositoryLabel}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Retention</p>
								<p className="font-medium">{summary.retentionLabel}</p>
							</div>
							{existingSchedule && (
								<>
									<div>
										<p className="text-xs uppercase text-muted-foreground">Last backup</p>
										<p className="font-medium">
											{existingSchedule.lastBackupAt
												? new Date(existingSchedule.lastBackupAt).toLocaleString()
												: "Never"}
										</p>
									</div>
									<div>
										<p className="text-xs uppercase text-muted-foreground">Status</p>
										<p className="font-medium">
											{existingSchedule.lastBackupStatus === "success" && "✓ Success"}
											{existingSchedule.lastBackupStatus === "error" && "✗ Error"}
											{!existingSchedule.lastBackupStatus && "—"}
										</p>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				) : (
					<Card className="h-full">
						<CardHeader>
							<CardTitle>Schedule summary</CardTitle>
							<CardDescription>Review the backup configuration before saving.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4 text-sm">
							<div>
								<p className="text-xs uppercase text-muted-foreground">Volume</p>
								<p className="font-medium">{summary.vol}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Schedule</p>
								<p className="font-medium">{summary.scheduleLabel}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Repository</p>
								<p className="font-medium">{summary.repositoryLabel}</p>
							</div>
							<div>
								<p className="text-xs uppercase text-muted-foreground">Retention</p>
								<p className="font-medium">{summary.retentionLabel}</p>
							</div>
						</CardContent>
					</Card>
				)
			}
		/>
	);
};
