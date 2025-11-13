import { Calendar, Clock, Database, FolderTree, HardDrive } from "lucide-react";
import { useNavigate } from "react-router";
import { ByteSize } from "~/client/components/bytes-size";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/client/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/client/components/ui/tooltip";
import { formatDuration } from "~/utils/utils";
import type { ListSnapshotsResponse } from "../api-client";

type Snapshot = ListSnapshotsResponse[number];

type Props = {
	snapshots: Snapshot[];
	repositoryName: string;
};

export const SnapshotsTable = ({ snapshots, repositoryName }: Props) => {
	const navigate = useNavigate();

	const handleRowClick = (snapshotId: string) => {
		navigate(`/repositories/${repositoryName}/${snapshotId}`);
	};

	return (
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
					{snapshots.map((snapshot) => (
						<TableRow
							key={snapshot.short_id}
							className="hover:bg-accent/50 cursor-pointer"
							onClick={() => handleRowClick(snapshot.short_id)}
						>
							<TableCell className="font-mono text-sm">
								<div className="flex items-center gap-2">
									<HardDrive className="h-4 w-4 text-muted-foreground" />
									<span className="text-strong-accent">{snapshot.short_id}</span>
								</div>
							</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">{new Date(snapshot.time).toLocaleString()}</span>
								</div>
							</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<Database className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">
										<ByteSize bytes={snapshot.size} base={1024} />
									</span>
								</div>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								<div className="flex items-center justify-end gap-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">{formatDuration(snapshot.duration / 1000)}</span>
								</div>
							</TableCell>
							<TableCell className="hidden lg:table-cell">
								<div className="flex items-center justify-end gap-2">
									<FolderTree className="h-4 w-4 text-muted-foreground" />
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-xs bg-primary/10 text-primary rounded-md px-2 py-1 cursor-help">
												{snapshot.paths.length} {snapshot.paths.length === 1 ? "path" : "paths"}
											</span>
										</TooltipTrigger>
										<TooltipContent side="top" className="max-w-md">
											<div className="flex flex-col gap-1">
												{snapshot.paths.map((path) => (
													<div key={`${snapshot.short_id}-${path}`} className="text-xs font-mono">
														{path}
													</div>
												))}
											</div>
										</TooltipContent>
									</Tooltip>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};
