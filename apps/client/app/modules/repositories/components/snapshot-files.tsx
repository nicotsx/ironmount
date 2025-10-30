import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { listSnapshotFiles } from "~/api-client";
import { listSnapshotFilesOptions } from "~/api-client/@tanstack/react-query.gen";
import { FileTree } from "~/components/file-tree";

interface FileEntry {
	name: string;
	path: string;
	type: string;
	size?: number;
	mtime?: string;
}

type Props = {
	name: string;
	snapshotId: string;
};

export const SnapshotFilesList = ({ name, snapshotId }: Props) => {
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
	const [fetchedFolders, setFetchedFolders] = useState<Set<string>>(new Set(["/"]));
	const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
	const [allFiles, setAllFiles] = useState<Map<string, FileEntry>>(new Map());
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery({
		...listSnapshotFilesOptions({
			path: { name, snapshotId },
			query: { path: "/" },
		}),
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
					const result = await listSnapshotFiles({
						path: { name: name ?? "", snapshotId: snapshotId ?? "" },
						query: { path: folderPath },
						throwOnError: true,
					});

					if (result.data) {
						setAllFiles((prev) => {
							const next = new Map(prev);
							for (const file of result.data.files) {
								next.set(file.path, file);
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
		[name, snapshotId, fetchedFolders],
	);

	const handleFolderHover = useCallback(
		async (folderPath: string) => {
			if (!fetchedFolders.has(folderPath) && !loadingFolders.has(folderPath)) {
				queryClient.prefetchQuery(
					listSnapshotFilesOptions({
						path: { name, snapshotId },
						query: { path: folderPath },
					}),
				);
			}
		},
		[name, snapshotId, fetchedFolders, loadingFolders, queryClient],
	);

	if (isLoading && fileArray.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading files...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-destructive">Failed to load files: {(error as Error).message}</p>
			</div>
		);
	}

	if (fileArray.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center p-8">
				<FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
				<p className="text-muted-foreground">This snapshot appears to be empty.</p>
			</div>
		);
	}

	return (
		<div className="overflow-auto flex-1 border rounded-md bg-card">
			<FileTree
				files={fileArray.map((f) => ({
					name: f.name,
					path: f.path,
					type: f.type === "dir" ? "directory" : "file",
					size: f.size,
					modifiedAt: f.mtime ? new Date(f.mtime).getTime() : undefined,
				}))}
				onFolderExpand={handleFolderExpand}
				onFolderHover={handleFolderHover}
				expandedFolders={expandedFolders}
				loadingFolders={loadingFolders}
			/>
		</div>
	);
};
