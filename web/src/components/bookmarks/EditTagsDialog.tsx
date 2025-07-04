import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { XCircle } from "lucide-react";

type TagType = { _id: Id<"tags">; name: string };
export type BookmarkTypeForEditDialog = {
  _id: Id<"bookmarks">;
  title: string;
  tags: TagType[];
};

interface EditTagsDialogState {
  isOpen: boolean;
  bookmark: BookmarkTypeForEditDialog | null;
  newTagName: string;
}

interface EditTagsDialogProps {
  dialogState: EditTagsDialogState;
  setDialogState: React.Dispatch<React.SetStateAction<EditTagsDialogState>>;
  // We might need to pass a callback to refresh bookmarks if optimistic updates aren't enough
}

export function EditTagsDialog({ dialogState, setDialogState }: EditTagsDialogProps) {
  const { mutate: addTagToBookmarkMutation, isPending: addTagToBookmarkMutationPending } = useMutation({
    mutationFn: useConvexMutation(api.tags.addTagToBookmark),
    onSuccess: (data, variables) => {
      // Optimistically update the dialog state or rely on parent component refetch
      // For now, just clear the input. A more robust solution would update the bookmark's tags in the dialog.
      if (dialogState.bookmark) {
        // This is a simplified optimistic update.
        // A real one would need the ID of the newly created tag if it's a new tag.
        // For now, we assume the parent will refetch or handle the update.
        // setDialogState(prev => ({
        //   ...prev,
        //   bookmark: prev.bookmark ? {
        //     ...prev.bookmark,
        //     tags: [...prev.bookmark.tags, { _id: "temp-id" as Id<"tags">, name: variables.tagName }] // This is not correct as _id is unknown
        //   } : null,
        //   newTagName: ""
        // }));
      }
      setDialogState(prev => ({ ...prev, newTagName: "" }));
      // Potentially call a onSuccess prop to trigger refetch in parent
    },
    onError: (error) => {
      console.error("Failed to add tag to bookmark:", error);
    },
  });

  const { mutate: removeTagFromBookmarkMutation } = useMutation({
    mutationFn: useConvexMutation(api.tags.removeTagFromBookmark),
    onSuccess: (data, variables) => {
      // Optimistically update UI or rely on Convex refetch
      setDialogState(prev => ({
        ...prev,
        bookmark: prev.bookmark
          ? {
              ...prev.bookmark,
              tags: prev.bookmark.tags.filter(t => t._id !== variables.tagId),
            }
          : null,
      }));
      // Potentially call a onSuccess prop to trigger refetch in parent
    },
    onError: (error) => {
      console.error("Failed to remove tag from bookmark:", error);
    },
  });

  if (!dialogState.isOpen || !dialogState.bookmark) {
    return null;
  }

  const handleAddTag = async () => {
    if (dialogState.newTagName.trim() && dialogState.bookmark) {
      try {
        await addTagToBookmarkMutation({
          bookmarkId: dialogState.bookmark._id,
          tagName: dialogState.newTagName.trim(),
        });
        // Input is cleared and tags potentially updated via onSuccess
      } catch (error) {
        // Error handled by useMutation's onError
      }
    }
  };

  const handleRemoveTag = async (tagId: Id<"tags">) => {
    if (dialogState.bookmark) {
      try {
        await removeTagFromBookmarkMutation({
          bookmarkId: dialogState.bookmark._id,
          tagId: tagId,
        });
      } catch (error) {
        // Error handled by useMutation's onError
      }
    }
  };

  return (
    <Dialog
      open={dialogState.isOpen}
      onOpenChange={(isOpen) =>
        setDialogState((prev) => ({ ...prev, isOpen }))
      }
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tags for: {dialogState.bookmark.title}</DialogTitle>
          <DialogDescription>
            Manage tags for this bookmark. Click a tag to remove it, or type to add a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {dialogState.bookmark.tags.map((tag) => (
              <Badge
                key={tag._id}
                variant="default"
                className="text-sm pr-1 cursor-pointer bg-sky-500 hover:bg-sky-600"
                onClick={() => handleRemoveTag(tag._id)}
              >
                {tag.name}
                <XCircle className="h-3 w-3 ml-1.5 opacity-70 hover:opacity-100" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              id="newTagName"
              placeholder="Add new tag..."
              value={dialogState.newTagName}
              onChange={(e) =>
                setDialogState((prev) => ({
                  ...prev,
                  newTagName: e.target.value,
                }))
              }
              onKeyPress={async (e) => {
                if (e.key === "Enter") {
                  handleAddTag();
                }
              }}
            />
            <Button
              size="sm"
              disabled={!dialogState.newTagName.trim() || addTagToBookmarkMutationPending}
              onClick={handleAddTag}
            >
              {addTagToBookmarkMutationPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setDialogState({ isOpen: false, bookmark: null, newTagName: "" })}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
