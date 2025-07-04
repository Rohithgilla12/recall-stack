import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bookmarkActions, bookmarkStore } from "@/lib/bookmark-store";
import { useStore } from "@tanstack/react-store";
import { Search, Plus } from "lucide-react";
import { AddBookmarkDialog } from "./AddBookmarkDialog";
import type { Id } from "convex/_generated/dataModel";

type FolderType = {
  _id: Id<"folders">;
  name: string;
};

interface BookmarkSearchAndAddProps {
  userFolders: FolderType[];
}

export function BookmarkSearchAndAdd({ userFolders }: BookmarkSearchAndAddProps) {
  const searchQuery = useStore(bookmarkStore, (state) => state.searchQuery);

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => bookmarkActions.setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800"
          />
        </div>
        <AddBookmarkDialog userFolders={userFolders} />
      </div>
    </div>
  );
}
