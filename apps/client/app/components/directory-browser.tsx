import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { browseFilesystemOptions } from "~/api-client/@tanstack/react-query.gen";
import { FileTree, type FileEntry } from "./file-tree";
import { ScrollArea } from "./ui/scroll-area";

type Props = {
	onSelectPath: (path: string) => void;
	selectedPath?: string;
};

export const DirectoryBrowser = ({ onSelectPath, selectedPath }: Props) => {
	const queryClient = useQueryClient();
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
	const [fetchedFolders, setFetchedFolders] = useState<Set<string>>(new Set(["/"]));
	const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
	const [allFiles, setAllFiles] = useState<Map<string, FileEntry>>(new Map());

	const { data, isLoading } = useQuery({
		...browseFilesystemOptions({ query: { path: "/" } }),
	});

	useMemo(() => {
		if (data?.directories) {
			setAllFiles((prev) => {
				const next = new Map(prev);
				for (const dir of data.directories) {
					next.set(dir.path, { name: dir.name, path: dir.path, type: "folder" });
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
					const result = await queryClient.fetchQuery(
						browseFilesystemOptions({
							query: { path: folderPath },
						}),
					);

					if (result.directories) {
						setAllFiles((prev) => {
							const next = new Map(prev);
							for (const dir of result.directories) {
								next.set(dir.path, { name: dir.name, path: dir.path, type: "folder" });
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
		[fetchedFolders, queryClient],
	);

	const handleFolderHover = useCallback(
		(folderPath: string) => {
			if (!fetchedFolders.has(folderPath) && !loadingFolders.has(folderPath)) {
				queryClient.prefetchQuery(browseFilesystemOptions({ query: { path: folderPath } }));
			}
		},
		[fetchedFolders, loadingFolders, queryClient],
	);

	if (isLoading && fileArray.length === 0) {
		return (
			<div className="border rounded-lg overflow-hidden">
				<ScrollArea className="h-64">
					<div className="text-sm text-gray-500 p-4">Loading directories...</div>
				</ScrollArea>
			</div>
		);
	}

	if (fileArray.length === 0) {
		return (
			<div className="border rounded-lg overflow-hidden">
				<ScrollArea className="h-64">
					<div className="text-sm text-gray-500 p-4">No subdirectories found</div>
				</ScrollArea>
			</div>
		);
	}

	return (
		<div className="border rounded-lg overflow-hidden">
			<ScrollArea className="h-64">
				<FileTree
					files={fileArray}
					onFolderExpand={handleFolderExpand}
					onFolderHover={handleFolderHover}
					expandedFolders={expandedFolders}
					loadingFolders={loadingFolders}
					foldersOnly
					selectableFolders
					selectedFolder={selectedPath}
					onFolderSelect={onSelectPath}
				/>
			</ScrollArea>

			{selectedPath && (
				<div className="bg-muted/50 border-t p-2 text-sm">
					<div className="font-medium text-muted-foreground">Selected path:</div>
					<div className="font-mono text-xs break-all">{selectedPath}</div>
				</div>
			)}
		</div>
	);
};
