import { Card, CardContent } from "@/components/ui/card";
import { bookmarkActions, bookmarkStore } from "@/lib/bookmark-store";
import { useStore } from "@tanstack/react-store";
import type { Id } from "convex/_generated/dataModel";
import { Folder, Home } from "lucide-react";
import { AddFolderDialog } from "./AddFolderDialog";

type FolderType = {
  _id: Id<"folders">;
  name: string;
  // parentId?: Id<"folders"> | null; // Optional
};

interface BookmarkFolderManagementProps {
  userFolders: FolderType[];
  // bookmarks: any[]; // If needed for counts, but try to avoid passing full bookmarks list
}

export function BookmarkFolderManagement({ userFolders }: BookmarkFolderManagementProps) {
  const selectedFolderIdStore = useStore(bookmarkStore, (state) => state.selectedFolder);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Folders</h2>
        <AddFolderDialog userFolders={userFolders} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Root Folder Card */}
        <Card
          className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${
            selectedFolderIdStore === null
              ? "border-indigo-600"
              : "border-slate-200 dark:border-slate-600"
          } bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700`}
          onClick={() => bookmarkActions.setSelectedFolder(null)}
        >
          <CardContent className="p-4 text-center">
            <Home className="h-8 w-8 mx-auto mb-2 text-indigo-600 group-hover:text-indigo-700" />
            <p className="text-sm font-medium truncate">Root</p>
            {/* Optionally, count bookmarks in root - This would require passing bookmark data or a derived count */}
          </CardContent>
        </Card>

        {userFolders.map((folder) => (
          <Card
            key={folder._id}
            className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${
              selectedFolderIdStore === folder._id
                ? "border-indigo-600"
                : "border-slate-200 dark:border-slate-600"
            } bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700`}
            onClick={() => bookmarkActions.setSelectedFolder(folder._id)}
          >
            <CardContent className="p-4 text-center">
              <Folder className="h-8 w-8 mx-auto mb-2 text-indigo-600 group-hover:text-indigo-700" />
              <p className="text-sm font-medium truncate">{folder.name}</p>
              {/* Count items in folder - requires more complex data fetching or client-side calculation */}
              {/* <p className="text-xs text-muted-foreground">
                {bookmarks.filter(b => b.folderId === folder._id).length} items
              </p> */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
