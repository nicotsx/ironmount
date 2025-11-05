import { useQuery } from "@tanstack/react-query";
import { intervalToDuration } from "date-fns";
import { Database } from "lucide-react";
import { useState } from "react";
import { listSnapshotsOptions } from "~/api-client/@tanstack/react-query.gen";
import { ByteSize } from "~/components/bytes-size";
import { SnapshotsTable } from "~/components/snapshots-table";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "~/components/ui/table";
import type { Repository, Snapshot } from "~/lib/types";

type Props = {
	repository: Repository;
};

export const formatSnapshotDuration = (seconds: number) => {
	const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
	const parts: string[] = [];

	if (duration.days) parts.push(`${duration.days}d`);
	if (duration.hours) parts.push(`${duration.hours}h`);
	if (duration.minutes) parts.push(`${duration.minutes}m`);
	if (duration.seconds || parts.length === 0) parts.push(`${duration.seconds || 0}s`);

	return parts.join(" ");
};

export const RepositorySnapshotsTabContent = ({ repository }: Props) => {
	const [searchQuery, setSearchQuery] = useState("");

	const { data, isFetching, failureReason } = useQuery({
		...listSnapshotsOptions({ path: { name: repository.name } }),
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
		initialData: [],
	});

	const filteredSnapshots = data.filter((snapshot: Snapshot) => {
		if (!searchQuery) return true;
		const searchLower = searchQuery.toLowerCase();
		return (
			snapshot.short_id.toLowerCase().includes(searchLower) ||
			snapshot.paths.some((path) => path.toLowerCase().includes(searchLower))
		);
	});

	const hasNoFilteredSnapshots = !filteredSnapshots?.length && !data.length;

	if (repository.status === "error") {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center text-center py-12">
					<Database className="mb-4 h-12 w-12 text-destructive" />
					<p className="text-destructive font-semibold">Repository Error</p>
					<p className="text-sm text-muted-foreground mt-2">
						This repository is in an error state and cannot be accessed.
					</p>
					{repository.lastError && (
						<div className="mt-4 max-w-md bg-destructive/10 border border-destructive/20 rounded-md p-3">
							<p className="text-sm text-destructive">{repository.lastError}</p>
						</div>
					)}
				</CardContent>
			</Card>
		);
	}

	if (isFetching && !data.length) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-12">
					<p className="text-muted-foreground">Loading snapshots</p>
				</CardContent>
			</Card>
		);
	}

	if (failureReason) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center text-center py-12">
					<Database className="mb-4 h-12 w-12 text-destructive" />
					<p className="text-destructive font-semibold">Failed to Load Snapshots</p>
					<p className="text-sm text-muted-foreground mt-2">{failureReason.message}</p>
				</CardContent>
			</Card>
		);
	}

	if (!data.length) {
		return (
			<Card>
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
							Snapshots are point-in-time backups of your data. Create your first backup to see it here.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="p-0 gap-0">
			<CardHeader className="p-4 bg-card-header">
				<div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 justify-between">
					<div className="flex-1">
						<CardTitle>Snapshots</CardTitle>
						<CardDescription className="mt-1">
							Backup snapshots stored in this repository. Total: {data.length}
						</CardDescription>
					</div>
					<div className="flex gap-2 items-center">
						<Input
							className="w-full lg:w-[240px]"
							placeholder="Search snapshots..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</CardHeader>
			{hasNoFilteredSnapshots ? (
				<Table className="border-t">
					<TableBody>
						<TableRow>
							<TableCell colSpan={5} className="text-center py-12">
								<div className="flex flex-col items-center gap-3">
									<p className="text-muted-foreground">No snapshots match your search.</p>
									<Button onClick={() => setSearchQuery("")} variant="outline" size="sm">
										Clear search
									</Button>
								</div>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			) : (
				<SnapshotsTable snapshots={filteredSnapshots} repositoryName={repository.name} />
			)}
			<div className="px-4 py-2 text-sm text-muted-foreground bg-card-header flex justify-between border-t">
				<span>
					{hasNoFilteredSnapshots
						? "No snapshots match filters."
						: `Showing ${filteredSnapshots.length} of ${data.length}`}
				</span>
				{!hasNoFilteredSnapshots && (
					<span>
						Total size:&nbsp;
						<span className="text-strong-accent font-medium">
							<ByteSize
								bytes={filteredSnapshots.reduce((sum, s) => sum + s.size, 0)}
								base={1024}
								maximumFractionDigits={1}
							/>
						</span>
					</span>
				)}
			</div>
		</Card>
	);
};
