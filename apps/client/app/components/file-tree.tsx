/**
 * FileTree Component
 *
 * Adapted from bolt.new by StackBlitz
 * Copyright (c) 2024 StackBlitz, Inc.
 * Licensed under the MIT License
 *
 * Original source: https://github.com/stackblitz/bolt.new
 */

import { ChevronDown, ChevronRight, File as FileIcon, Folder as FolderIcon, Loader2 } from "lucide-react";
import { memo, type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "~/lib/utils";

const NODE_PADDING_LEFT = 12;

interface FileEntry {
	name: string;
	path: string;
	type: "file" | "directory";
	size?: number;
	modifiedAt?: number;
}

interface Props {
	files?: FileEntry[];
	selectedFile?: string;
	onFileSelect?: (filePath: string) => void;
	onFolderExpand?: (folderPath: string) => void;
	expandedFolders?: Set<string>;
	loadingFolders?: Set<string>;
	className?: string;
}

export const FileTree = memo((props: Props) => {
	const {
		files = [],
		onFileSelect,
		selectedFile,
		onFolderExpand,
		expandedFolders = new Set(),
		loadingFolders = new Set(),
		className,
	} = props;

	const fileList = useMemo(() => {
		return buildFileList(files);
	}, [files]);

	const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

	const filteredFileList = useMemo(() => {
		const list = [];
		let lastDepth = Number.MAX_SAFE_INTEGER;

		for (const fileOrFolder of fileList) {
			const depth = fileOrFolder.depth;

			// if the depth is equal we reached the end of the collapsed group
			if (lastDepth === depth) {
				lastDepth = Number.MAX_SAFE_INTEGER;
			}

			// ignore collapsed folders
			if (collapsedFolders.has(fileOrFolder.fullPath)) {
				lastDepth = Math.min(lastDepth, depth);
			}

			// ignore files and folders below the last collapsed folder
			if (lastDepth < depth) {
				continue;
			}

			list.push(fileOrFolder);
		}

		return list;
	}, [fileList, collapsedFolders]);

	const toggleCollapseState = (fullPath: string) => {
		setCollapsedFolders((prevSet) => {
			const newSet = new Set(prevSet);

			if (newSet.has(fullPath)) {
				newSet.delete(fullPath);
				onFolderExpand?.(fullPath);
			} else {
				newSet.add(fullPath);
			}

			return newSet;
		});
	};

	// Add new folders to collapsed set when file list changes
	useEffect(() => {
		setCollapsedFolders((prevSet) => {
			const newSet = new Set(prevSet);
			for (const item of fileList) {
				if (item.kind === "folder" && !newSet.has(item.fullPath) && !expandedFolders.has(item.fullPath)) {
					newSet.add(item.fullPath);
				}
			}
			return newSet;
		});
	}, [fileList, expandedFolders]);

	return (
		<div className={cn("text-sm", className)}>
			{filteredFileList.map((fileOrFolder) => {
				switch (fileOrFolder.kind) {
					case "file": {
						return (
							<File
								key={fileOrFolder.id}
								selected={selectedFile === fileOrFolder.fullPath}
								file={fileOrFolder}
								onClick={() => {
									onFileSelect?.(fileOrFolder.fullPath);
								}}
							/>
						);
					}
					case "folder": {
						return (
							<Folder
								key={fileOrFolder.id}
								folder={fileOrFolder}
								collapsed={collapsedFolders.has(fileOrFolder.fullPath)}
								loading={loadingFolders.has(fileOrFolder.fullPath)}
								onClick={() => {
									toggleCollapseState(fileOrFolder.fullPath);
								}}
							/>
						);
					}
					default: {
						return undefined;
					}
				}
			})}
		</div>
	);
});

interface FolderProps {
	folder: FolderNode;
	collapsed: boolean;
	loading?: boolean;
	onClick: () => void;
}

function Folder({ folder: { depth, name }, collapsed, loading, onClick }: FolderProps) {
	return (
		<NodeButton
			className={cn("group hover:bg-accent/50 text-foreground")}
			depth={depth}
			icon={
				loading ? (
					<Loader2 className="w-4 h-4 shrink-0 animate-spin" />
				) : collapsed ? (
					<ChevronRight className="w-4 h-4 shrink-0" />
				) : (
					<ChevronDown className="w-4 h-4 shrink-0" />
				)
			}
			onClick={onClick}
		>
			<FolderIcon className="w-4 h-4 shrink-0 text-strong-accent" />
			<span className="truncate">{name}</span>
		</NodeButton>
	);
}

interface FileProps {
	file: FileNode;
	selected: boolean;
	onClick: () => void;
}

function File({ file: { depth, name }, onClick, selected }: FileProps) {
	return (
		<NodeButton
			className={cn("group", {
				"hover:bg-accent/50 text-foreground": !selected,
				"bg-accent text-accent-foreground": selected,
			})}
			depth={depth}
			icon={<FileIcon className="w-4 h-4 shrink-0 text-gray-500" />}
			onClick={onClick}
		>
			<span className="truncate">{name}</span>
		</NodeButton>
	);
}

interface ButtonProps {
	depth: number;
	icon: ReactNode;
	children: ReactNode;
	className?: string;
	onClick?: () => void;
}

function NodeButton({ depth, icon, onClick, className, children }: ButtonProps) {
	return (
		<button
			type="button"
			className={cn("flex items-center gap-2 w-full pr-2 text-sm py-1.5 text-left", className)}
			style={{ paddingLeft: `${8 + depth * NODE_PADDING_LEFT}px` }}
			onClick={() => onClick?.()}
		>
			{icon}
			<div className="truncate w-full flex items-center gap-2">{children}</div>
		</button>
	);
}

type Node = FileNode | FolderNode;

interface BaseNode {
	id: number;
	depth: number;
	name: string;
	fullPath: string;
}

interface FileNode extends BaseNode {
	kind: "file";
}

interface FolderNode extends BaseNode {
	kind: "folder";
}

function buildFileList(files: FileEntry[]): Node[] {
	const fileMap = new Map<string, Node>();

	for (const file of files) {
		const segments = file.path.split("/").filter((segment) => segment);
		const depth = segments.length - 1;
		const name = segments[segments.length - 1];

		if (!fileMap.has(file.path)) {
			fileMap.set(file.path, {
				kind: file.type === "file" ? "file" : "folder",
				id: fileMap.size,
				name,
				fullPath: file.path,
				depth,
			});
		}
	}

	// Convert map to array and sort
	return sortFileList(Array.from(fileMap.values()));
}

function sortFileList(nodeList: Node[]): Node[] {
	const nodeMap = new Map<string, Node>();
	const childrenMap = new Map<string, Node[]>();

	// Pre-sort nodes by name and type
	nodeList.sort((a, b) => compareNodes(a, b));

	for (const node of nodeList) {
		nodeMap.set(node.fullPath, node);

		const parentPath = node.fullPath.slice(0, node.fullPath.lastIndexOf("/")) || "/";

		if (parentPath !== "/") {
			if (!childrenMap.has(parentPath)) {
				childrenMap.set(parentPath, []);
			}
			childrenMap.get(parentPath)?.push(node);
		}
	}

	const sortedList: Node[] = [];

	const depthFirstTraversal = (path: string): void => {
		const node = nodeMap.get(path);

		if (node) {
			sortedList.push(node);
		}

		const children = childrenMap.get(path);

		if (children) {
			for (const child of children) {
				if (child.kind === "folder") {
					depthFirstTraversal(child.fullPath);
				} else {
					sortedList.push(child);
				}
			}
		}
	};

	// Start with root level items
	const rootItems = nodeList.filter((node) => {
		const parentPath = node.fullPath.slice(0, node.fullPath.lastIndexOf("/")) || "/";
		return parentPath === "/";
	});

	for (const item of rootItems) {
		depthFirstTraversal(item.fullPath);
	}

	return sortedList;
}

function compareNodes(a: Node, b: Node): number {
	if (a.kind !== b.kind) {
		return a.kind === "folder" ? -1 : 1;
	}

	return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}
