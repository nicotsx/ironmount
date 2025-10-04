import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { listFilesOptions } from "~/api-client/@tanstack/react-query.gen";
import { FileTree } from "~/components/file-tree";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Volume } from "~/lib/types";

type Props = {
	volume: Volume;
};

export const FilesTabContent = ({ volume }: Props) => {
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	const { data, isLoading, error } = useQuery({
		...listFilesOptions({
			path: { name: volume.name },
		}),
		enabled: volume.status === "mounted",
		refetchInterval: 10000,
	});

	const handleFolderExpand = (folderPath: string) => {
		setExpandedFolders((prev) => {
			const next = new Set(prev);
			next.add(folderPath);
			return next;
		});
		// You could optionally fetch the contents of the folder here
		// For now, we're fetching everything at once
	};

	if (volume.status !== "mounted") {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center text-center py-12">
					<FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
					<p className="text-muted-foreground">Volume must be mounted to browse files.</p>
					<p className="text-sm text-muted-foreground mt-2">Mount the volume to explore its contents.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-[600px] flex flex-col">
			<CardHeader>
				<CardTitle>File Explorer</CardTitle>
				<CardDescription>Browse the files and folders in this volume.</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 overflow-hidden flex flex-col">
				{isLoading && (
					<div className="flex items-center justify-center h-full">
						<p className="text-muted-foreground">Loading files...</p>
					</div>
				)}
				{error && (
					<div className="flex items-center justify-center h-full">
						<p className="text-destructive">Failed to load files: {String(error)}</p>
					</div>
				)}
				{!isLoading && !error && data?.files && (
					<div className="overflow-auto flex-1 border rounded-md bg-card">
						{data.files.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center p-8">
								<FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground">This volume is empty.</p>
								<p className="text-sm text-muted-foreground mt-2">
									Files and folders will appear here once you add them.
								</p>
							</div>
						) : (
							<FileTree
								files={data.files}
								onFolderExpand={handleFolderExpand}
								expandedFolders={expandedFolders}
								className="p-2"
							/>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
