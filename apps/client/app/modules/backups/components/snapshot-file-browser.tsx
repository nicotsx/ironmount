import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileIcon } from "lucide-react";
import { listSnapshotFilesOptions } from "~/api-client/@tanstack/react-query.gen";
import { FileTree, type FileEntry } from "~/components/file-tree";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Snapshot } from "~/lib/types";

interface Props {
	snapshot: Snapshot;
	repositoryName: string;
}

export const SnapshotFileBrowser = (props: Props) => {
	const { snapshot, repositoryName } = props;

	const queryClient = useQueryClient();
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
	const [fetchedFolders, setFetchedFolders] = useState<Set<string>>(new Set());
	const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
	const [allFiles, setAllFiles] = useState<Map<string, FileEntry>>(new Map());

	const volumeBasePath = snapshot.paths[0]?.match(/^(.*?_data)(\/|$)/)?.[1] || "";

	const { data: filesData, isLoading: filesLoading } = useQuery({
		...listSnapshotFilesOptions({
			path: { name: repositoryName, snapshotId: snapshot.short_id },
			query: { path: volumeBasePath },
		}),
	});

	const stripBasePath = useCallback(
		(path: string): string => {
			if (!volumeBasePath) return path;
			if (path === volumeBasePath) return "/";
			if (path.startsWith(`${volumeBasePath}/`)) {
				const stripped = path.slice(volumeBasePath.length);
				return stripped;
			}
			return path;
		},
		[volumeBasePath],
	);

	const addBasePath = useCallback(
		(displayPath: string): string => {
			if (!volumeBasePath) return displayPath;
			if (displayPath === "/") return volumeBasePath;
			return `${volumeBasePath}${displayPath}`;
		},
		[volumeBasePath],
	);

	useMemo(() => {
		if (filesData?.files) {
			setAllFiles((prev) => {
				const next = new Map(prev);
				for (const file of filesData.files) {
					const strippedPath = stripBasePath(file.path);
					if (strippedPath !== "/") {
						next.set(strippedPath, { ...file, path: strippedPath });
					}
				}
				return next;
			});
			setFetchedFolders((prev) => new Set(prev).add("/"));
		}
	}, [filesData, stripBasePath]);

	const fileArray = useMemo(() => Array.from(allFiles.values()), [allFiles]);

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
					const fullPath = addBasePath(folderPath);

					const result = await queryClient.fetchQuery(
						listSnapshotFilesOptions({
							path: { name: repositoryName, snapshotId: snapshot.short_id },
							query: { path: fullPath },
						}),
					);

					if (result.files) {
						setAllFiles((prev) => {
							const next = new Map(prev);
							for (const file of result.files) {
								const strippedPath = stripBasePath(file.path);
								// Skip the directory itself
								if (strippedPath !== folderPath) {
									next.set(strippedPath, { ...file, path: strippedPath });
								}
							}
							return next;
						});

						setFetchedFolders((prev) => new Set(prev).add(folderPath));
					}
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
		[repositoryName, snapshot, fetchedFolders, queryClient, stripBasePath, addBasePath],
	);

	const handleFolderHover = useCallback(
		(folderPath: string) => {
			if (!fetchedFolders.has(folderPath) && !loadingFolders.has(folderPath)) {
				const fullPath = addBasePath(folderPath);

				queryClient.prefetchQuery(
					listSnapshotFilesOptions({
						path: { name: repositoryName, snapshotId: snapshot.short_id },
						query: { path: fullPath },
					}),
				);
			}
		},
		[repositoryName, snapshot, fetchedFolders, loadingFolders, queryClient, addBasePath],
	);

	return (
		<div className="space-y-4">
			<Card className="h-[600px] flex flex-col">
				<CardHeader>
					<CardTitle>File Browser</CardTitle>
					<CardDescription>{`Viewing snapshot from ${new Date(snapshot?.time ?? 0).toLocaleString()}`}</CardDescription>
				</CardHeader>
				<CardContent className="flex-1 overflow-hidden flex flex-col p-0">
					{filesLoading && fileArray.length === 0 && (
						<div className="flex items-center justify-center flex-1">
							<p className="text-muted-foreground">Loading files...</p>
						</div>
					)}

					{fileArray.length === 0 && !filesLoading && (
						<div className="flex flex-col items-center justify-center flex-1 text-center p-8">
							<FileIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
							<p className="text-muted-foreground">No files in this snapshot</p>
						</div>
					)}

					{fileArray.length > 0 && (
						<div className="overflow-auto flex-1 border border-border rounded-md bg-card m-4">
							<FileTree
								files={fileArray}
								onFolderExpand={handleFolderExpand}
								onFolderHover={handleFolderHover}
								expandedFolders={expandedFolders}
								loadingFolders={loadingFolders}
								className="px-2 py-2"
							/>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
