import { useCallback, useEffect, useMemo, useState } from "react";
import type { FileEntry } from "../components/file-tree";

type FetchFolderFn = (
	path: string,
) => Promise<{ files?: FileEntry[]; directories?: Array<{ name: string; path: string }> }>;

type PathTransformFns = {
	strip?: (path: string) => string;
	add?: (path: string) => string;
};

type UseFileBrowserOptions = {
	initialData?: { files?: FileEntry[]; directories?: Array<{ name: string; path: string }> };
	isLoading?: boolean;
	fetchFolder: FetchFolderFn;
	prefetchFolder?: (path: string) => void;
	pathTransform?: PathTransformFns;
	rootPath?: string;
};

export const useFileBrowser = ({
	initialData,
	isLoading = false,
	fetchFolder,
	prefetchFolder,
	pathTransform,
	rootPath = "/",
}: UseFileBrowserOptions) => {
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
	const [fetchedFolders, setFetchedFolders] = useState<Set<string>>(new Set([rootPath]));
	const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
	const [allFiles, setAllFiles] = useState<Map<string, FileEntry>>(new Map());

	const stripPath = pathTransform?.strip;
	const addPath = pathTransform?.add;

	useMemo(() => {
		if (initialData?.files) {
			const files = initialData.files;
			setAllFiles((prev) => {
				const next = new Map(prev);
				for (const file of files) {
					const path = stripPath ? stripPath(file.path) : file.path;
					if (path !== rootPath) {
						next.set(path, { ...file, path });
					}
				}
				return next;
			});
			if (rootPath) {
				setFetchedFolders((prev) => new Set(prev).add(rootPath));
			}
		} else if (initialData?.directories) {
			const directories = initialData.directories;
			setAllFiles((prev) => {
				const next = new Map(prev);
				for (const dir of directories) {
					next.set(dir.path, { name: dir.name, path: dir.path, type: "folder" });
				}
				return next;
			});
		}
	}, [initialData, stripPath, rootPath]);

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
					const pathToFetch = addPath ? addPath(folderPath) : folderPath;
					const result = await fetchFolder(pathToFetch);

					if (result.files) {
						const files = result.files;
						setAllFiles((prev) => {
							const next = new Map(prev);
							for (const file of files) {
								const strippedPath = stripPath ? stripPath(file.path) : file.path;
								// Skip the directory itself
								if (strippedPath !== folderPath) {
									next.set(strippedPath, { ...file, path: strippedPath });
								}
							}
							return next;
						});
					} else if (result.directories) {
						const directories = result.directories;
						setAllFiles((prev) => {
							const next = new Map(prev);
							for (const dir of directories) {
								next.set(dir.path, { name: dir.name, path: dir.path, type: "folder" });
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
		[fetchedFolders, fetchFolder, stripPath, addPath],
	);

	const handleFolderHover = useCallback(
		(folderPath: string) => {
			if (!fetchedFolders.has(folderPath) && !loadingFolders.has(folderPath) && prefetchFolder) {
				const pathToPrefetch = addPath ? addPath(folderPath) : folderPath;
				prefetchFolder(pathToPrefetch);
			}
		},
		[fetchedFolders, loadingFolders, prefetchFolder, addPath],
	);

	return {
		fileArray,
		expandedFolders,
		loadingFolders,
		handleFolderExpand,
		handleFolderHover,
		isLoading: isLoading && fileArray.length === 0,
		isEmpty: fileArray.length === 0 && !isLoading,
	};
};
