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
import { bookmarkActions, bookmarkStore } from "@/lib/bookmark-store";
import { useStore } from "@tanstack/react-store";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { FolderPlus } from "lucide-react";

type FolderType = {
  _id: Id<"folders">;
  name: string;
  // parentId?: Id<"folders"> | null; // Optional: if you need to display parent info
};

interface AddFolderDialogProps {
  userFolders: FolderType[]; // Pass userFolders to populate parent folder select
}

export function AddFolderDialog({ userFolders }: AddFolderDialogProps) {
  const isFolderDialogOpen = useStore(
    bookmarkStore,
    (state) => state.isFolderDialogOpen,
  );
  const newFolderForm = useStore(
    bookmarkStore,
    (state) => state.newFolderForm,
  );

  const {
    mutate: createFolderMutation,
    isPending: createFolderMutationPending,
  } = useMutation({
    mutationFn: useConvexMutation(api.bookmarks.createFolder),
    onSuccess: () => {
      bookmarkActions.submitCreateFolderForm(); // Closes dialog and resets form
    },
    onError: (error) => {
      console.error("Failed to create folder:", error);
    },
  });

  const handleCreateFolder = async () => {
    if (!newFolderForm.name) {
      console.error("Folder name is required.");
      return;
    }
    try {
      await createFolderMutation({
        name: newFolderForm.name,
        // parentId: newFolderForm.parentId !== "root" ? (newFolderForm.parentId as Id<"folders">) : undefined,
      });
    } catch (error) {
      // Error is already logged by onError in useMutation
    }
  };

  return (
    <Dialog
      open={isFolderDialogOpen}
      onOpenChange={bookmarkActions.setIsFolderDialogOpen}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Organize your bookmarks with folders
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              placeholder="Enter folder name"
              value={newFolderForm.name}
              onChange={(e) =>
                bookmarkActions.updateNewFolderForm({ name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="parentFolder">Parent Folder (Optional)</Label>
            <Select
              value={newFolderForm.parentId || "root"}
              onValueChange={(value) =>
                bookmarkActions.updateNewFolderForm({
                  parentId: value === "root" ? null : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">No parent (root level)</SelectItem>
                {userFolders.map((folder) => (
                  <SelectItem key={folder._id} value={folder._id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={createFolderMutationPending}
            onClick={handleCreateFolder}
            className="w-full"
          >
            {createFolderMutationPending ? "Creating..." : "Create Folder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
