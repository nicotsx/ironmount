import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Database, HardDrive, Plus } from "lucide-react";
import { Link } from "react-router";
import { listBackupSchedules } from "~/api-client";
import { listBackupSchedulesOptions } from "~/api-client/@tanstack/react-query.gen";
import { EmptyState } from "~/components/empty-state";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/backups";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Ironmount" },
		{
			name: "description",
			content: "Create, manage, monitor, and automate your Docker volumes with ease.",
		},
	];
}

export const clientLoader = async () => {
	const jobs = await listBackupSchedules();
	if (jobs.data) return jobs.data;
	return [];
};

export default function Backups({ loaderData }: Route.ComponentProps) {
	const { data: schedules, isLoading } = useQuery({
		...listBackupSchedulesOptions(),
		initialData: loaderData,
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading backup schedules...</p>
			</div>
		);
	}

	if (!schedules || schedules.length === 0) {
		return (
			<EmptyState
				icon={CalendarClock}
				title="No backup job"
				description="Backup jobs help you automate the process of backing up your volumes on a regular schedule to ensure your data is safe and secure."
				button={
					<Button>
						<Link to="/backups/create" className="flex items-center">
							<Plus className="h-4 w-4 mr-2" />
							Create a backup job
						</Link>
					</Button>
				}
			/>
		);
	}

	return (
		<div className="container mx-auto space-y-6">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{schedules.map((schedule) => (
					<Link key={schedule.id} to={`/backup-jobs/${schedule.id}`}>
						<Card key={schedule.id} className="flex flex-col">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2 flex-1 min-w-0">
										<HardDrive className="h-5 w-5 text-muted-foreground flex-shrink-0" />
										<CardTitle className="text-lg truncate">Volume #{schedule.volumeId}</CardTitle>
									</div>
									<Badge variant={schedule.enabled ? "default" : "secondary"} className="flex-shrink-0">
										{schedule.enabled ? "Active" : "Paused"}
									</Badge>
								</div>
								<CardDescription className="flex items-center gap-2 mt-2">
									<Database className="h-4 w-4" />
									<span className="truncate">{schedule.repositoryId}</span>
								</CardDescription>
							</CardHeader>
							<CardContent className="flex-1 space-y-4">
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Schedule</span>
										<code className="text-xs bg-muted px-2 py-1 rounded">{schedule.cronExpression}</code>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Last backup</span>
										<span className="font-medium">
											{schedule.lastBackupAt ? new Date(schedule.lastBackupAt).toLocaleDateString() : "Never"}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Next backup</span>
										<span className="font-medium">
											{schedule.nextBackupAt ? new Date(schedule.nextBackupAt).toLocaleDateString() : "N/A"}
										</span>
									</div>
									{schedule.lastBackupStatus && (
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Status</span>
											<Badge
												variant={schedule.lastBackupStatus === "success" ? "default" : "destructive"}
												className="text-xs"
											>
												{schedule.lastBackupStatus}
											</Badge>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
