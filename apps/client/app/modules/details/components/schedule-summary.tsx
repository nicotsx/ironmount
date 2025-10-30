import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Database, FolderTree, HardDrive, Pencil } from "lucide-react";
import { useMemo } from "react";
import { listSnapshotsOptions } from "~/api-client/@tanstack/react-query.gen";
import { ByteSize } from "~/components/bytes-size";
import { OnOff } from "~/components/onoff";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import type { BackupSchedule, Repository, Volume } from "~/lib/types";
import { formatSnapshotDuration } from "~/modules/repositories/tabs/snapshots";

type Props = {
	volume: Volume;
	schedule: BackupSchedule;
	repository: Repository;
	handleToggleEnabled: (enabled: boolean) => void;
	setIsEditMode: (isEdit: boolean) => void;
};

export const ScheduleSummary = (props: Props) => {
	const { volume, schedule, repository, handleToggleEnabled, setIsEditMode } = props;

	const { data: snapshots, isLoading: loadingSnapshots } = useQuery({
		...listSnapshotsOptions({
			path: { name: repository.name },
			query: { volumeId: volume.id },
		}),
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

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
			vol: volume.name,
			scheduleLabel,
			repositoryLabel: schedule.repositoryId || "No repository selected",
			retentionLabel: retentionParts.length > 0 ? retentionParts.join(" • ") : "No retention policy",
		};
	}, [schedule, volume.name]);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between gap-4">
					<div>
						<CardTitle>Backup schedule</CardTitle>
						<CardDescription>Automated backup configuration for {volume.name}</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<OnOff isOn={schedule.enabled} toggle={handleToggleEnabled} enabledLabel="Enabled" disabledLabel="Paused" />
						<Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
							<Pencil className="h-4 w-4 mr-2" />
							Edit schedule
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
						<p className="font-medium">{summary.repositoryLabel}</p>
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
							{!schedule.lastBackupStatus && "—"}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card className="p-0 gap-0">
				<CardHeader className="p-4 bg-card-header">
					<div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
						<div className="flex-1">
							<CardTitle>Snapshots</CardTitle>
							<CardDescription className="mt-1">
								Backup snapshots for this volume. Total: {snapshots?.snapshots.length}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				{loadingSnapshots && !snapshots ? (
					<CardContent className="flex items-center justify-center py-12">
						<p className="text-muted-foreground">Loading snapshots...</p>
					</CardContent>
				) : !snapshots ? (
					<CardContent className="flex flex-col items-center justify-center text-center py-16 px-4">
						<div className="relative mb-8">
							<div className="absolute inset-0 animate-pulse">
								<div className="w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
							</div>
							<div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
								<Database className="w-16 h-16 text-primary/70" strokeWidth={1.5} />
							</div>
						</div>
						<div className="max-w-md space-y-3">
							<h3 className="text-2xl font-semibold text-foreground">No snapshots yet</h3>
							<p className="text-muted-foreground text-sm">
								Snapshots are point-in-time backups of your data. The next scheduled backup will create the first
								snapshot.
							</p>
						</div>
					</CardContent>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table className="border-t">
								<TableHeader className="bg-card-header">
									<TableRow>
										<TableHead className="uppercase">Snapshot ID</TableHead>
										<TableHead className="uppercase">Date & Time</TableHead>
										<TableHead className="uppercase">Size</TableHead>
										<TableHead className="uppercase hidden md:table-cell text-right">Duration</TableHead>
										<TableHead className="uppercase hidden text-right lg:table-cell">Paths</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{snapshots.snapshots.map((s) => (
										<TableRow key={s.short_id} className="hover:bg-accent/50">
											<TableCell className="font-mono text-sm">
												<div className="flex items-center gap-2">
													<HardDrive className="h-4 w-4 text-muted-foreground" />
													<span className="text-strong-accent">{s.short_id}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Calendar className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm">{new Date(s.time).toLocaleString()}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Database className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium">
														<ByteSize bytes={s.size} base={1024} />
													</span>
												</div>
											</TableCell>
											<TableCell className="hidden md:table-cell">
												<div className="flex items-center justify-end gap-2">
													<Clock className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm text-muted-foreground">
														{formatSnapshotDuration(s.duration / 1000)}
													</span>
												</div>
											</TableCell>
											<TableCell className="hidden lg:table-cell">
												<div className="flex items-center justify-end gap-2">
													<FolderTree className="h-4 w-4 text-muted-foreground" />
													<div className="flex flex-wrap gap-1">
														<span
															className="text-xs bg-primary/10 text-primary rounded-md px-2 py-1"
															title={s.paths[0]}
														>
															{s.paths[0].split("/").filter(Boolean).pop() || "/"}
														</span>
														<Tooltip>
															<TooltipTrigger asChild>
																<span
																	className={`text-xs bg-muted text-muted-foreground rounded-md px-2 py-1 cursor-help ${s.paths.length <= 1 ? "hidden" : ""}`}
																>
																	+{s.paths.length - 1}
																</span>
															</TooltipTrigger>
															<TooltipContent side="top" className="max-w-md">
																<div className="flex flex-col gap-1">
																	{s.paths.slice(1).map((path) => (
																		<div key={`${s.short_id}-${path}`} className="text-xs">
																			{path}
																		</div>
																	))}
																</div>
															</TooltipContent>
														</Tooltip>
													</div>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
						<div className="px-4 py-2 text-sm text-muted-foreground bg-card-header flex justify-between border-t">
							<span>{`Showing ${snapshots.snapshots.length} of ${snapshots.snapshots.length}`}</span>
							<span>
								Total size:&nbsp;
								<span className="text-strong-accent font-medium">
									<ByteSize
										bytes={snapshots.snapshots.reduce((sum, s) => sum + s.size, 0)}
										base={1024}
										maximumFractionDigits={1}
									/>
								</span>
							</span>
						</div>
					</>
				)}
			</Card>
		</div>
	);
};
