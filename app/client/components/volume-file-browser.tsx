import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { listFilesOptions } from "~/api-client/@tanstack/react-query.gen";
import { FileTree } from "~/client/components/file-tree";

interface FileEntry {
	name: string;
	path: string;
	type: "file" | "directory";
	size?: number;
	modifiedAt?: number;
}

type VolumeFileBrowserProps = {
	volumeName: string;
	enabled?: boolean;
	withCheckboxes?: boolean;
	selectedPaths?: Set<string>;
	onSelectionChange?: (paths: Set<string>) => void;
	foldersOnly?: boolean;
	className?: string;
	emptyMessage?: string;
	emptyDescription?: string;
};

export const VolumeFileBrowser = ({
	volumeName,
	enabled = true,
	withCheckboxes = false,
	selectedPaths,
	onSelectionChange,
	foldersOnly = false,
	className,
	emptyMessage = "This volume appears to be empty.",
	emptyDescription,
}: VolumeFileBrowserProps) => {
	const queryClient = useQueryClient();
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
	const [fetchedFolders, setFetchedFolders] = useState<Set<string>>(new Set(["/"]));
	const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
	const [allFiles, setAllFiles] = useState<Map<string, FileEntry>>(new Map());

	const { data, isLoading, error } = useQuery({
		...listFilesOptions({ path: { name: volumeName } }),
		enabled,
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
					const result = await queryClient.ensureQueryData(
						listFilesOptions({
							path: { name: volumeName },
							query: { path: folderPath },
						}),
					);

					if (result.files) {
						setAllFiles((prev) => {
							const next = new Map(prev);
							for (const file of result.files) {
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
		[volumeName, fetchedFolders, queryClient.ensureQueryData],
	);

	const handleFolderHover = useCallback(
		(folderPath: string) => {
			if (!fetchedFolders.has(folderPath) && !loadingFolders.has(folderPath)) {
				queryClient.prefetchQuery(
					listFilesOptions({
						path: { name: volumeName },
						query: { path: folderPath },
					}),
				);
			}
		},
		[volumeName, fetchedFolders, loadingFolders, queryClient],
	);

	if (isLoading && fileArray.length === 0) {
		return (
			<div className="flex items-center justify-center h-full min-h-[200px]">
				<p className="text-muted-foreground">Loading files...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full min-h-[200px]">
				<p className="text-destructive">Failed to load files: {(error as Error).message}</p>
			</div>
		);
	}

	if (fileArray.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[200px]">
				<FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
				<p className="text-muted-foreground">{emptyMessage}</p>
				{emptyDescription && <p className="text-sm text-muted-foreground mt-2">{emptyDescription}</p>}
			</div>
		);
	}

	return (
		<div className={className}>
			<FileTree
				files={fileArray}
				onFolderExpand={handleFolderExpand}
				onFolderHover={handleFolderHover}
				expandedFolders={expandedFolders}
				loadingFolders={loadingFolders}
				withCheckboxes={withCheckboxes}
				selectedPaths={selectedPaths}
				onSelectionChange={onSelectionChange}
				foldersOnly={foldersOnly}
			/>
		</div>
	);
};
