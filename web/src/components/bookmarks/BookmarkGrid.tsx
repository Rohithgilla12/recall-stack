import { BookmarkCard, BookmarkCardType } from "./BookmarkCard"; // Ensure BookmarkCardType is exported from BookmarkCard
import type { BookmarkTypeForEditDialog } from "./EditTagsDialog"; // Import the specific type
import { Button } from "@/components/ui/button";
import { Plus, Bookmark as BookmarkIcon } from "lucide-react"; // Renamed Bookmark to avoid conflict
import { bookmarkActions, bookmarkStore } from "@/lib/bookmark-store";
import { useStore } from "@tanstack/react-store";


interface BookmarkGridProps {
  bookmarks: BookmarkCardType[]; // Use the specific type for bookmarks
  onEditTags: (bookmark: BookmarkTypeForEditDialog) => void;
}

export function BookmarkGrid({ bookmarks, onEditTags }: BookmarkGridProps) {
  const searchQuery = useStore(bookmarkStore, (state) => state.searchQuery);
  const selectedTagIdStore = useStore(bookmarkStore, (state) => state.selectedTag);
  const selectedFolderIdStore = useStore(bookmarkStore, (state) => state.selectedFolder);

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No bookmarks found</h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery || selectedTagIdStore || selectedFolderIdStore
            ? "Try adjusting your search or filters."
            : "Start by adding your first bookmark!"}
        </p>
        <Button onClick={() => bookmarkActions.setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Bookmark
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark._id}
          bookmark={bookmark}
          onEditTags={onEditTags}
        />
      ))}
    </div>
  );
}
