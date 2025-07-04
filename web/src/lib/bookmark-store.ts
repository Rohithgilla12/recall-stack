import { Store } from "@tanstack/store"
// Convex queries will be imported and used directly in components.

// Types for form data handled by the store
interface NewBookmarkForm {
	url: string
	title: string
	description: string
	tags: string[] // For capturing tags during creation
	folderId: string | null // To store the ID of the selected folder
}

interface NewFolderForm {
	name: string
	parentId: string | null
}

// Define the shape of the store's state
interface BookmarkStoreState {
	searchQuery: string
	selectedTag: string | null // Can be a tag ID or name, or null for 'all'
	selectedFolder: string | null // Folder ID, or null for root/all folders
	isAddDialogOpen: boolean
	isFolderDialogOpen: boolean
	newBookmarkForm: NewBookmarkForm
	newFolderForm: NewFolderForm
}

export const bookmarkStore = new Store<BookmarkStoreState>({
	searchQuery: "",
	selectedTag: null, // Default to no tag selected
	selectedFolder: null, // Default to no folder selected (root)
	isAddDialogOpen: false,
	isFolderDialogOpen: false,
	newBookmarkForm: {
		url: "",
		title: "",
		description: "",
		tags: [],
		folderId: null,
	},
	newFolderForm: {
		name: "",
		parentId: null,
	},
})

// Helper functions to update store state
export const bookmarkActions = {
	setSearchQuery: (query: string) => {
		bookmarkStore.setState((state) => ({ ...state, searchQuery: query }))
	},

	// selectedTag could be the tag's ID or a special value like "all"
	setSelectedTag: (tag: string | null) => {
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

	updateNewBookmarkForm: (updates: Partial<NewBookmarkForm>) => {
		bookmarkStore.setState((state) => ({
			...state,
			newBookmarkForm: { ...state.newBookmarkForm, ...updates },
		}))
	},

	updateNewFolderForm: (updates: Partial<NewFolderForm>) => {
		bookmarkStore.setState((state) => ({
			...state,
			newFolderForm: { ...state.newFolderForm, ...updates },
		}))
	},

	resetNewBookmarkForm: () => {
		bookmarkStore.setState((state) => ({
			...state,
			newBookmarkForm: {
				url: "",
				title: "",
				description: "",
				tags: [],
				folderId: null, // Reset folderId to null
			},
		}))
	},

	resetNewFolderForm: () => {
		bookmarkStore.setState((state) => ({
			...state,
			newFolderForm: {
				name: "",
				parentId: null, // Reset parentId to null
			},
		}))
	},

	// Actions for adding bookmark and creating folder now primarily manage UI state.
	// The actual mutation calls will be handled by the components using useMutation from react-query.
	submitAddBookmarkForm: () => {
		// Logic for handling form submission (e.g., validation) can be added here if needed
		// For now, it just closes the dialog and resets the form.
		// The component will take `newBookmarkForm` state and call the Convex mutation.
		console.log("Bookmark form data:", bookmarkStore.state.newBookmarkForm)
		bookmarkActions.setIsAddDialogOpen(false)
		bookmarkActions.resetNewBookmarkForm()
	},

	submitCreateFolderForm: () => {
		// Similar to submitAddBookmarkForm, component handles mutation.
		console.log("Folder form data:", bookmarkStore.state.newFolderForm)
		bookmarkActions.setIsFolderDialogOpen(false)
		bookmarkActions.resetNewFolderForm()
	},
}

// Derived states like filteredBookmarks and bookmarkStats are removed.
// This logic will now reside in components, using data fetched via Convex queries
// and applying filters/derivations based on bookmarkStore.state (searchQuery, selectedTag, selectedFolder).
