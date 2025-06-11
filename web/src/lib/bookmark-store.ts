import { Derived, Store } from "@tanstack/store"
import { getBookmarks, getUserFolders } from "convex/bookmarks"

// Mock data - replace with your Convex queries
const mockBookmarks = [
	{
		id: "1",
		title: "React Server Components Guide",
		description:
			"A comprehensive guide to understanding and implementing React Server Components in modern applications.",
		url: "https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023",
		imageUrl: "/placeholder.svg?height=200&width=400",
		tags: ["React", "Server Components", "Frontend"],
		createdAt: Date.now() - 86400000,
		summary:
			"Detailed explanation of RSC architecture and implementation patterns.",
		isArchived: false,
	},
	{
		id: "2",
		title: "Advanced TypeScript Patterns",
		description:
			"Learn advanced TypeScript patterns for building scalable applications with better type safety.",
		url: "https://typescript.org/docs",
		imageUrl: "/placeholder.svg?height=200&width=400",
		tags: ["TypeScript", "Programming", "Patterns"],
		createdAt: Date.now() - 172800000,
		summary: "Covers utility types, conditional types, and advanced generics.",
		isArchived: false,
	},
	{
		id: "3",
		title: "Database Design Best Practices",
		description:
			"Essential principles for designing efficient and scalable database schemas.",
		url: "https://example.com/database-design",
		imageUrl: "/placeholder.svg?height=200&width=400",
		tags: ["Database", "Design", "Backend"],
		createdAt: Date.now() - 259200000,
		summary:
			"Normalization, indexing strategies, and performance optimization.",
		isArchived: true,
	},
]

const mockTags = [
	"React",
	"TypeScript",
	"Database",
	"Frontend",
	"Backend",
	"Design",
	"Programming",
	"Patterns",
	"Server Components",
]

const mockFolders = ["Work", "Personal", "Learning", "Projects"]

interface NewBookmark {
	url: string
	title: string
	description: string
	tags: string[]
	folder: string
}

interface NewFolder {
	name: string
	parentId: string | null
}

interface BookmarkState {
	searchQuery: string
	selectedTag: string
	selectedFolder: string | null
	isAddDialogOpen: boolean
	isFolderDialogOpen: boolean
	newBookmark: NewBookmark
	newFolder: NewFolder
	bookmarks: typeof mockBookmarks
	tags: string[]
	folders: string[]
}

export const bookmarkStore = new Store<BookmarkState>({
	searchQuery: "",
	selectedTag: "all",
	selectedFolder: null,
	isAddDialogOpen: false,
	isFolderDialogOpen: false,
	newBookmark: {
		url: "",
		title: "",
		description: "",
		tags: [],
		folder: "",
	},
	newFolder: {
		name: "",
		parentId: null,
	},
	bookmarks: mockBookmarks,
	tags: mockTags,
	folders: mockFolders,
})

// Derived state for filtered bookmarks
export const filteredBookmarks = new Derived({
	fn: () => {
		const state = bookmarkStore.state
		return state.bookmarks.filter((bookmark) => {
			const matchesSearch =
				bookmark.title
					.toLowerCase()
					.includes(state.searchQuery.toLowerCase()) ||
				bookmark.description
					.toLowerCase()
					.includes(state.searchQuery.toLowerCase())
			const matchesTag =
				state.selectedTag === "all" || bookmark.tags.includes(state.selectedTag)
			return matchesSearch && matchesTag
		})
	},
	deps: [bookmarkStore],
})

// Derived state for bookmark stats
export const bookmarkStats = new Derived({
	fn: () => {
		const bookmarks = bookmarkStore.state.bookmarks
		return {
			total: bookmarks.length,
			active: bookmarks.filter((b) => !b.isArchived).length,
			archived: bookmarks.filter((b) => b.isArchived).length,
			totalTags: bookmarkStore.state.tags.length,
		}
	},
	deps: [bookmarkStore],
})

// Mount derived stores
filteredBookmarks.mount()
bookmarkStats.mount()

// Helper functions to update store
export const bookmarkActions = {
	setSearchQuery: (query: string) => {
		bookmarkStore.setState((state) => ({ ...state, searchQuery: query }))
	},

	setSelectedTag: (tag: string) => {
		bookmarkStore.setState((state) => ({ ...state, selectedTag: tag }))
	},

	setSelectedFolder: (folderId: string | null) => {
		bookmarkStore.setState((state) => ({ ...state, selectedFolder: folderId }))
	},

	setIsAddDialogOpen: (isOpen: boolean) => {
		bookmarkStore.setState((state) => ({ ...state, isAddDialogOpen: isOpen }))
	},

	setIsFolderDialogOpen: (isOpen: boolean) => {
		bookmarkStore.setState((state) => ({
			...state,
			isFolderDialogOpen: isOpen,
		}))
	},

	updateNewBookmark: (updates: Partial<NewBookmark>) => {
		bookmarkStore.setState((state) => ({
			...state,
			newBookmark: { ...state.newBookmark, ...updates },
		}))
	},

	updateNewFolder: (updates: Partial<NewFolder>) => {
		bookmarkStore.setState((state) => ({
			...state,
			newFolder: { ...state.newFolder, ...updates },
		}))
	},

	resetNewBookmark: () => {
		bookmarkStore.setState((state) => ({
			...state,
			newBookmark: {
				url: "",
				title: "",
				description: "",
				tags: [],
				folder: "",
			},
		}))
	},

	resetNewFolder: () => {
		bookmarkStore.setState((state) => ({
			...state,
			newFolder: {
				name: "",
				parentId: null,
			},
		}))
	},

	addBookmark: () => {
		const state = bookmarkStore.state
		console.log("Adding bookmark:", state.newBookmark)
		// Here you would call your Convex mutation
		bookmarkActions.setIsAddDialogOpen(false)
		bookmarkActions.resetNewBookmark()
	},

	createFolder: () => {
		const state = bookmarkStore.state
		console.log("Creating folder:", state.newFolder)
		// Here you would call your Convex mutation
		bookmarkActions.setIsFolderDialogOpen(false)
		bookmarkActions.resetNewFolder()
	},
}
