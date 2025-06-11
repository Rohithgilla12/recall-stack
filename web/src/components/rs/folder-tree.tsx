"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	ChevronDown,
	ChevronRight,
	Folder,
	FolderOpen,
	MoreHorizontal,
} from "lucide-react"
import { useState } from "react"

interface FolderNode {
	id: string
	name: string
	parentId: string | null
	children: FolderNode[]
	bookmarkCount: number
}

// Mock hierarchical folder data
const mockFolderTree: FolderNode[] = [
	{
		id: "1",
		name: "Work",
		parentId: null,
		bookmarkCount: 15,
		children: [
			{
				id: "2",
				name: "Projects",
				parentId: "1",
				bookmarkCount: 8,
				children: [
					{
						id: "3",
						name: "React App",
						parentId: "2",
						bookmarkCount: 5,
						children: [],
					},
				],
			},
			{
				id: "4",
				name: "Resources",
				parentId: "1",
				bookmarkCount: 7,
				children: [],
			},
		],
	},
	{
		id: "5",
		name: "Personal",
		parentId: null,
		bookmarkCount: 12,
		children: [
			{
				id: "6",
				name: "Learning",
				parentId: "5",
				bookmarkCount: 6,
				children: [],
			},
		],
	},
]

interface FolderTreeItemProps {
	folder: FolderNode
	level: number
	selectedFolder: string | null
	onSelectFolder: (folderId: string) => void
}

function FolderTreeItem({
	folder,
	level,
	selectedFolder,
	onSelectFolder,
}: FolderTreeItemProps) {
	const [isExpanded, setIsExpanded] = useState(level < 2)
	const hasChildren = folder.children.length > 0
	const isSelected = selectedFolder === folder.id

	return (
		<div>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
					isSelected
						? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
						: ""
				}`}
				style={{ paddingLeft: `${level * 16 + 8}px` }}
				onClick={() => onSelectFolder(folder.id)}
			>
				{hasChildren ? (
					<Button
						variant="ghost"
						size="sm"
						className="h-4 w-4 p-0 hover:bg-transparent"
						onClick={(e) => {
							e.stopPropagation()
							setIsExpanded(!isExpanded)
						}}
					>
						{isExpanded ? (
							<ChevronDown className="h-3 w-3" />
						) : (
							<ChevronRight className="h-3 w-3" />
						)}
					</Button>
				) : (
					<div className="w-4" />
				)}

				{isExpanded && hasChildren ? (
					<FolderOpen className="h-4 w-4 text-indigo-600" />
				) : (
					<Folder className="h-4 w-4 text-indigo-600" />
				)}

				<span className="flex-1 text-sm font-medium truncate">
					{folder.name}
				</span>

				<span className="text-xs text-muted-foreground">
					{folder.bookmarkCount}
				</span>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal className="h-3 w-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>Rename</DropdownMenuItem>
						<DropdownMenuItem>Add Subfolder</DropdownMenuItem>
						<DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{isExpanded && hasChildren && (
				<div>
					{folder.children.map((child) => (
						<FolderTreeItem
							key={child.id}
							folder={child}
							level={level + 1}
							selectedFolder={selectedFolder}
							onSelectFolder={onSelectFolder}
						/>
					))}
				</div>
			)}
		</div>
	)
}

interface FolderTreeProps {
	selectedFolder: string | null
	onSelectFolder: (folderId: string) => void
}

export default function FolderTree({
	selectedFolder,
	onSelectFolder,
}: FolderTreeProps) {
	return (
		<div className="space-y-1">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
					selectedFolder === "all"
						? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
						: ""
				}`}
				onClick={() => onSelectFolder("all")}
			>
				<Folder className="h-4 w-4 text-indigo-600" />
				<span className="flex-1 text-sm font-medium">All Bookmarks</span>
				<span className="text-xs text-muted-foreground">
					{mockFolderTree.reduce(
						(acc, folder) => acc + folder.bookmarkCount,
						0,
					)}
				</span>
			</div>

			{mockFolderTree.map((folder) => (
				<div key={folder.id} className="group">
					<FolderTreeItem
						folder={folder}
						level={0}
						selectedFolder={selectedFolder}
						onSelectFolder={onSelectFolder}
					/>
				</div>
			))}
		</div>
	)
}
