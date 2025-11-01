import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Database, HardDrive, Plus } from "lucide-react";
import { Link } from "react-router";
import { listBackupSchedulesOptions } from "~/api-client/@tanstack/react-query.gen";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default function BackupJobsPage() {
	const { data: schedules, isLoading } = useQuery({
		...listBackupSchedulesOptions(),
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
			<Card>
				<CardContent className="py-16">
					<div className="flex flex-col items-center justify-center text-center">
						<div className="relative mb-6">
							<div className="absolute inset-0 animate-pulse">
								<div className="w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
							</div>
							<div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
								<CalendarClock className="w-16 h-16 text-primary/70" strokeWidth={1.5} />
							</div>
						</div>
						<h3 className="text-xl font-semibold mb-2">No backup job created</h3>
						<p className="text-muted-foreground text-sm mb-6 max-w-md">
							Backup jobs allow you to create automated backup schedules for your volumes. Set up your first backup job
							to ensure your data is securely backed up.
						</p>
						<Button>
							<Link to="/repositories" className="flex items-center">
								<Plus className="h-4 w-4 mr-2" />
								Create a backup job
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
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
