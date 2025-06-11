import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogOut, Menu, Settings, User } from "lucide-react"
import { useState } from "react"
import FolderTree from "./folder-tree"

interface SidebarLayoutProps {
	children: React.ReactNode
	selectedFolder: string | null
	onSelectFolder: (folderId: string) => void
}

export default function SidebarLayout({
	children,
	selectedFolder,
	onSelectFolder,
}: SidebarLayoutProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const SidebarContent = () => (
		<div className="flex flex-col h-full">
			<div className="p-4">
				<h2 className="text-lg font-semibold mb-4">Folders</h2>
				<FolderTree
					selectedFolder={selectedFolder}
					onSelectFolder={onSelectFolder}
				/>
			</div>

			<div className="mt-auto p-4">
				<Separator className="mb-4" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="w-full justify-start p-2">
							<Avatar className="h-8 w-8 mr-3">
								<AvatarImage src="/placeholder.svg?height=32&width=32" />
								<AvatarFallback>JD</AvatarFallback>
							</Avatar>
							<div className="flex-1 text-left">
								<p className="text-sm font-medium">John Doe</p>
								<p className="text-xs text-muted-foreground">
									john@example.com
								</p>
							</div>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuItem>
							<User className="h-4 w-4 mr-2" />
							Profile
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Settings className="h-4 w-4 mr-2" />
							Settings
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<LogOut className="h-4 w-4 mr-2" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)

	return (
		<div className="flex h-screen bg-slate-50 dark:bg-slate-900">
			{/* Desktop Sidebar */}
			<div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white lg:dark:bg-slate-800">
				<SidebarContent />
			</div>

			{/* Mobile Sidebar */}
			<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
				<SheetTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="lg:hidden fixed top-4 left-4 z-50"
					>
						<Menu className="h-5 w-5" />
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-64 p-0">
					<SidebarContent />
				</SheetContent>
			</Sheet>

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">{children}</div>
		</div>
	)
}
