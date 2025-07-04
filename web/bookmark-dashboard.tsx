import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router"; // Added import
import { useStore } from "@tanstack/react-store";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery as useConvexReactQuery } from "convex/react"; // Renamed to avoid conflict
import { useConvexQuery } from "@convex-dev/react-query"; // Keep this for specific uses if any, or consolidate

import { bookmarkActions, bookmarkStore } from "@/lib/bookmark-store";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon } from "lucide-react"; // Renamed Tag to TagIcon

// Import child components
import { BookmarkStatsCards } from "@/components/bookmarks/BookmarkStatsCards";
import { BookmarkSearchAndAdd } from "@/components/bookmarks/BookmarkSearchAndAdd";
import { BookmarkFolderManagement } from "@/components/bookmarks/BookmarkFolderManagement";
import { BookmarkGrid } from "@/components/bookmarks/BookmarkGrid";
import { EditTagsDialog, BookmarkTypeForEditDialog } from "@/components/bookmarks/EditTagsDialog";
import type { BookmarkCardType } from "@/components/bookmarks/BookmarkCard"; // Ensure this type is comprehensive

// Define types locally or import from a shared types file
// These types might be slightly different from BookmarkCardType or BookmarkTypeForEditDialog
// if the main dashboard component handles a superset of data.
type TagType = { _id: Id<"tags">; name: string; userId?: string /* other fields if any */ };
type FolderType = { _id: Id<"folders">; name: string; userId?: string /* other fields if any */ };
type FullBookmarkType = BookmarkCardType; // Assuming BookmarkCardType is the most complete version needed here

export default function BookmarkDashboard() {
  const { isSignedIn } = useAuth();

  // Store subscriptions for UI state
  const selectedTagIdStore = useStore(bookmarkStore, (state) => state.selectedTag);
  const selectedFolderIdStore = useStore(bookmarkStore, (state) => state.selectedFolder);
  // searchQuery is managed within BookmarkSearchAndAdd component via bookmarkStore

  // State for managing the "Edit Tags" dialog
  const [editTagsDialogState, setEditTagsDialogState] = React.useState<{
    isOpen: boolean;
    bookmark: BookmarkTypeForEditDialog | null;
    newTagName: string;
  }>({ isOpen: false, bookmark: null, newTagName: "" });

  // Convex queries
  // The useQuery hook from convex/react is often used for top-level data fetching.
  // Ensure correct query parameters are passed based on selected filters.
  const bookmarks: FullBookmarkType[] = useConvexReactQuery(
    api.bookmarks.getBookmarks,
    // Skip query if not signed in, or if params are not ready (though folderId/tagId can be null)
    isSignedIn ? {
      folderId: selectedFolderIdStore ?? undefined, // Pass null or undefined if no folder selected
      tagId: selectedTagIdStore ?? undefined, // Pass null or undefined if no tag selected
      // searchQuery: searchQuery, // If getBookmarks supports search query directly
    } : "skip"
  ) || [];

  // If your getBookmarks query doesn't handle search, you might need to filter client-side
  // For simplicity, this example assumes getBookmarks can take all filters or search is done client-side in BookmarkGrid if needed.

  const userFolders = useConvexQuery(
    api.bookmarks.getUserFolders,
    isSignedIn ? {} : "skip"
  ) || [] as FolderType[];

  const userTags = useConvexQuery(
    api.tags.getAllUserTags,
    isSignedIn ? {} : "skip"
  ) || [] as TagType[];

  // If not signed in, redirect or show login message (handled by route and below)
  const navigate = useNavigate(); // Added for programmatic navigation

  React.useEffect(() => {
    if (!isSignedIn) {
      // Programmatic redirect to /login if not signed in.
      // This acts as a fallback or if component is rendered outside protected route.
      navigate({ to: "/login", replace: true });
    }
  }, [isSignedIn, navigate]);

  if (!isSignedIn) {
    // Render nothing or a loading spinner while redirecting
    return null;
  }

  // Calculate stats (can also be derived within BookmarkStatsCards if preferred)
  const totalBookmarks = bookmarks.length;
  const activeBookmarks = bookmarks.filter((b) => !b.isArchived).length;
  const archivedBookmarks = totalBookmarks - activeBookmarks;
  const totalTagsCount = userTags.length;

  const handleEditTags = (bookmark: BookmarkTypeForEditDialog) => {
    setEditTagsDialogState({ isOpen: true, bookmark, newTagName: "" });
  };

  // Filter bookmarks based on search query (if not done by backend query)
  // This is a basic client-side search example.
  // For better performance with large datasets, backend search is preferred.
  const searchQuery = useStore(bookmarkStore, (state) => state.searchQuery); // get current search query
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const titleMatch = bookmark.title.toLowerCase().includes(searchQuery.toLowerCase());
    const urlMatch = bookmark.url.toLowerCase().includes(searchQuery.toLowerCase());
    const descriptionMatch = bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const tagMatch = bookmark.tags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return titleMatch || urlMatch || descriptionMatch || tagMatch;
  });


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Main Content */}
        <div className="flex-1">
          <BookmarkSearchAndAdd userFolders={userFolders} />

          {/* Filter Tags Section */}
          <div className="mb-8 flex flex-wrap gap-2">
            <Button
              variant={selectedTagIdStore === null ? "default" : "outline"}
              size="sm"
              onClick={() => bookmarkActions.setSelectedTag(null)}
              className="rounded-full"
            >
              All Tags
            </Button>
            {userTags.map((tag) => (
              <Button
                key={tag._id}
                variant={selectedTagIdStore === tag._id ? "default" : "outline"}
                size="sm"
                onClick={() => bookmarkActions.setSelectedTag(tag._id)}
                className="rounded-full"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag.name}
              </Button>
            ))}
          </div>

          <BookmarkStatsCards
            totalBookmarks={totalBookmarks}
            activeBookmarks={activeBookmarks}
            archivedBookmarks={archivedBookmarks}
            totalTagsCount={totalTagsCount}
          />

          <BookmarkFolderManagement userFolders={userFolders} />

          <BookmarkGrid bookmarks={filteredBookmarks} onEditTags={handleEditTags} />

        </div>
      </div>

      <EditTagsDialog
        dialogState={editTagsDialogState}
        setDialogState={setEditTagsDialogState}
      />
    </div>
  );
}
