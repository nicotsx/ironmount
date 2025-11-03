import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileIcon, Folder } from "lucide-react";
import { listSnapshotFilesOptions } from "~/api-client/@tanstack/react-query.gen";
import { FileTree, type FileEntry } from "~/components/file-tree";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { ListSnapshotsResponse } from "~/api-client/types.gen";

interface Props {
	snapshots: ListSnapshotsResponse;
	repositoryName: string;
	snapshotId: string;
}

export const SnapshotFileBrowser = (props: Props) => {
	const { snapshots, repositoryName, snapshotId } = props;

	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([""]));

	const { data: filesData, isLoading: filesLoading } = useQuery({
		...listSnapshotFilesOptions({
			path: { name: repositoryName, snapshotId },
			query: { path: "/" },
		}),
	});

	const handleFolderExpand = (folderPath: string) => {
		const newFolders = new Set(expandedFolders);
		newFolders.add(folderPath);
		setExpandedFolders(newFolders);
	};

	const selectedSnapshot = useMemo(() => {
		return snapshots.find((s) => s.short_id === snapshotId);
	}, [snapshotId, snapshots]);

	if (snapshots.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center text-center py-16 px-4">
					<div className="relative mb-8">
						<div className="absolute inset-0 animate-pulse">
							<div className="w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
						</div>
						<div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
							<Folder className="w-16 h-16 text-primary/70" strokeWidth={1.5} />
						</div>
					</div>
					<div className="max-w-md space-y-3">
						<h3 className="text-2xl font-semibold text-foreground">No snapshots</h3>
						<p className="text-muted-foreground text-sm">
							Snapshots are point-in-time backups of your data. The first snapshot will appear here after the next
							scheduled backup.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<Card className="h-[600px] flex flex-col">
				<CardHeader>
					<CardTitle>File Browser</CardTitle>
					<CardDescription>{`Viewing snapshot from ${new Date(selectedSnapshot?.time ?? 0).toLocaleString()}`}</CardDescription>
				</CardHeader>
				<CardContent className="flex-1 overflow-hidden flex flex-col p-0">
					{filesLoading && (
						<div className="flex items-center justify-center flex-1">
							<p className="text-muted-foreground">Loading files...</p>
						</div>
					)}

					{filesData?.files.length === 0 && (
						<div className="flex flex-col items-center justify-center flex-1 text-center p-8">
							<FileIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
							<p className="text-muted-foreground">No files in this snapshot</p>
						</div>
					)}

					{filesData?.files.length && (
						<div className="overflow-auto flex-1 border border-border rounded-md bg-card m-4">
							<FileTree
								files={filesData?.files as FileEntry[]}
								onFolderExpand={handleFolderExpand}
								expandedFolders={expandedFolders}
								className="px-2 py-2"
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
