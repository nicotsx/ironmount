import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { listSnapshotFilesOptions } from "~/api-client/@tanstack/react-query.gen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { SnapshotFilesList } from "../components/snapshot-files";

export default function SnapshotDetailsPage() {
	const { name, snapshotId } = useParams<{ name: string; snapshotId: string }>();

	const { data } = useQuery({
		...listSnapshotFilesOptions({
			path: { name: name ?? "", snapshotId: snapshotId ?? "" },
			query: { path: "/" },
		}),
		enabled: !!name && !!snapshotId,
	});

	if (!name || !snapshotId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Invalid snapshot reference</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{name}</h1>
					<p className="text-sm text-muted-foreground">Snapshot: {snapshotId}</p>
				</div>
			</div>

			<Card className="h-[600px] flex flex-col">
				<CardHeader>
					<CardTitle>File Explorer</CardTitle>
					<CardDescription>Browse the files and folders in this snapshot.</CardDescription>
				</CardHeader>
				<CardContent className="flex-1 overflow-hidden flex flex-col">
					<SnapshotFilesList name={name} snapshotId={snapshotId} />
				</CardContent>
			</Card>

			{data?.snapshot && (
				<Card>
					<CardHeader>
						<CardTitle>Snapshot Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="text-muted-foreground">Snapshot ID:</span>
								<p className="font-mono">{data.snapshot.id}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Short ID:</span>
								<p className="font-mono">{data.snapshot.short_id}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Hostname:</span>
								<p>{data.snapshot.hostname}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Time:</span>
								<p>{new Date(data.snapshot.time).toLocaleString()}</p>
							</div>
							<div className="col-span-2">
								<span className="text-muted-foreground">Paths:</span>
								<div className="space-y-1 mt-1">
									{data.snapshot.paths.map((path) => (
										<p key={path} className="font-mono text-xs bg-muted px-2 py-1 rounded">
											{path}
										</p>
									))}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
