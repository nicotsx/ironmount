import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { listFilesOptions } from "~/api-client/@tanstack/react-query.gen";
import { listFiles } from "~/api-client/sdk.gen";
import { FileTree } from "~/components/file-tree";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Volume } from "~/lib/types";

type Props = {
	volume: Volume;
};

interface FileEntry {
	name: string;
	path: string;
	type: "file" | "directory";
	size?: number;
	modifiedAt?: number;
}

export const FilesTabContent = ({ volume }: Props) => {
	const queryClient = useQueryClient();
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
	const [fetchedFolders, setFetchedFolders] = useState<Set<string>>(new Set(["/"]));
	const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
	const [allFiles, setAllFiles] = useState<Map<string, FileEntry>>(new Map());

	// Fetch root level files
	const { data, isLoading, error } = useQuery({
		...listFilesOptions({ path: { name: volume.name } }),
		enabled: volume.status === "mounted",
		refetchInterval: 10000,
	});

	useMemo(() => {
		if (data?.files) {
			setAllFiles((prev) => {
				const next = new Map(prev);
				for (const file of data.files) {
					next.set(file.path, file);
				}
				return next;
			});
		}
	}, [data]);

	const handleFolderExpand = useCallback(
		async (folderPath: string) => {
			setExpandedFolders((prev) => {
				const next = new Set(prev);
				next.add(folderPath);
				return next;
			});

			if (!fetchedFolders.has(folderPath)) {
				setLoadingFolders((prev) => new Set(prev).add(folderPath));

				try {
					const result = await listFiles({
						path: { name: volume.name },
						query: { path: folderPath },
						throwOnError: true,
					});

					if (result.data?.files) {
						setAllFiles((prev) => {
							const next = new Map(prev);
							for (const file of result.data.files) {
								next.set(file.path, file);
							}
							return next;
						});
					}

					setFetchedFolders((prev) => new Set(prev).add(folderPath));
				} catch (error) {
					console.error("Failed to fetch folder contents:", error);
				} finally {
					setLoadingFolders((prev) => {
						const next = new Set(prev);
						next.delete(folderPath);
						return next;
					});
				}
			}
		},
		[volume.name, fetchedFolders],
	);

	// Prefetch folder contents on hover
	const handleFolderHover = useCallback(
		(folderPath: string) => {
			if (!fetchedFolders.has(folderPath) && !loadingFolders.has(folderPath)) {
				queryClient.prefetchQuery(
					listFilesOptions({
						path: { name: volume.name },
						query: { path: folderPath },
					}),
				);
			}
		},
		[volume.name, fetchedFolders, loadingFolders, queryClient],
	);

	const fileArray = useMemo(() => Array.from(allFiles.values()), [allFiles]);

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
						<p className="text-destructive">Failed to load files: {error.message}</p>
					</div>
				)}
				{!isLoading && !error && (
					<div className="overflow-auto flex-1 border rounded-md bg-card">
						{fileArray.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-center p-8">
								<FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground">This volume is empty.</p>
								<p className="text-sm text-muted-foreground mt-2">
									Files and folders will appear here once you add them.
								</p>
							</div>
						) : (
							<FileTree
								files={fileArray}
								onFolderExpand={handleFolderExpand}
								onFolderHover={handleFolderHover}
								expandedFolders={expandedFolders}
								loadingFolders={loadingFolders}
								className="p-2"
							/>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
