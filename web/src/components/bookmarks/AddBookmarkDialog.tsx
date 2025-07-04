import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bookmarkActions, bookmarkStore } from "@/lib/bookmark-store";
import { useStore } from "@tanstack/react-store";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Plus } from "lucide-react";

// Define a type for folder, assuming it's used here
type FolderType = {
  _id: Id<"folders">;
  name: string;
  // Add other relevant folder properties if needed
};

interface AddBookmarkDialogProps {
  userFolders: FolderType[]; // Pass userFolders as a prop
}

export function AddBookmarkDialog({ userFolders }: AddBookmarkDialogProps) {
  const isAddDialogOpen = useStore(
    bookmarkStore,
    (state) => state.isAddDialogOpen,
  );
  const newBookmarkForm = useStore(
    bookmarkStore,
    (state) => state.newBookmarkForm,
  );

  const {
    mutate: createBookmarkMutation,
    isPending: createBookmarkMutationPending,
  } = useMutation({
    mutationFn: useConvexMutation(api.bookmarks.createBookmark),
    onSuccess: () => {
      bookmarkActions.submitAddBookmarkForm(); // Closes dialog and resets form
    },
    onError: (error) => {
      console.error("Failed to create bookmark:", error);
    },
  });

  const handleCreateBookmark = async () => {
    if (!newBookmarkForm.url || !newBookmarkForm.title) {
      console.error("URL and Title are required.");
      return;
    }
    try {
      await createBookmarkMutation({
        title: newBookmarkForm.title,
        url: newBookmarkForm.url,
        description: newBookmarkForm.description,
        folderId: newBookmarkForm.folderId as Id<"folders"> | undefined,
        tags: newBookmarkForm.tags,
      });
    } catch (error) {
      // Error is already logged by onError in useMutation
    }
  };

  return (
    <Dialog
      open={isAddDialogOpen}
      onOpenChange={bookmarkActions.setIsAddDialogOpen}
    >
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Bookmark
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
          <DialogDescription>
            Save a new bookmark to your collection
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={newBookmarkForm.url}
              onChange={(e) =>
                bookmarkActions.updateNewBookmarkForm({ url: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Bookmark title"
              value={newBookmarkForm.title}
              onChange={(e) =>
                bookmarkActions.updateNewBookmarkForm({ title: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description..."
              value={newBookmarkForm.description}
              onChange={(e) =>
                bookmarkActions.updateNewBookmarkForm({
                  description: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="folder">Folder</Label>
            <Select
              value={newBookmarkForm.folderId || "root"}
              onValueChange={(value) =>
                bookmarkActions.updateNewBookmarkForm({
                  folderId: value === "root" ? null : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root</SelectItem>
                {userFolders.map((folder) => (
                  <SelectItem key={folder._id} value={folder._id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., react, typescript, cool"
              value={newBookmarkForm.tags.join(", ")}
              onChange={(e) =>
                bookmarkActions.updateNewBookmarkForm({
                  tags: e.target.value.split(",").map((tag) => tag.trim()),
                })
              }
            />
          </div>
          <Button
            disabled={createBookmarkMutationPending}
            onClick={handleCreateBookmark}
            className="w-full"
          >
            {createBookmarkMutationPending ? "Saving..." : "Save Bookmark"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
