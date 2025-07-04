import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  bookmarkActions,
  // bookmarkStats, // To be replaced or removed
  bookmarkStore,
} from "@/lib/bookmark-store";
import { useAuth } from "@clerk/clerk-react";
import { useStore } from "@tanstack/react-store";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react"; // Consolidated imports

import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import {
  Archive,
  Bookmark,
  Calendar,
  ExternalLink,
  Folder,
  FolderPlus,
  Globe,
  Home, 
  Pencil, 
  Plus,
  Search,
  Tag,
  XCircle,
} from "lucide-react";
import React from "react";


type TagType = { _id: Id<"tags">; name: string };
type BookmarkType = {
  _id: Id<"bookmarks">;
  title: string;
  url: string;
  description?: string;
  isArchived?: boolean;
  createdAt: number;
  folderId?: Id<"folders">;
  tags: TagType[]; // User-managed tags
  bookmarkContent?: {
    ogData?: { image?: string };
    aiSuggestedTags?: string[];
  } | null;
  summary?: string;
};



export default function BookmarkDashboard() {
  const { isSignedIn } = useAuth();

  // Store subscriptions for UI state
  const searchQuery = useStore(bookmarkStore, (state) => state.searchQuery);
  const selectedTagIdStore = useStore(bookmarkStore, (state) => state.selectedTag);
  const selectedFolderIdStore = useStore(bookmarkStore, (state) => state.selectedFolder);
  const isAddDialogOpen = useStore(bookmarkStore, (state) => state.isAddDialogOpen);
  const isFolderDialogOpen = useStore(bookmarkStore, (state) => state.isFolderDialogOpen);
  const newBookmarkForm = useStore(bookmarkStore, (state) => state.newBookmarkForm);
  const newFolderForm = useStore(bookmarkStore, (state) => state.newFolderForm);

  // State for managing the "Edit Tags" dialog
  const [editTagsDialog, setEditTagsDialog] = React.useState<{
    isOpen: boolean;
    bookmark: BookmarkType | null;
    newTagName: string;
  }>({ isOpen: false, bookmark: null, newTagName: "" });


  // Convex queries
  const bookmarks: BookmarkType[] = useQuery(
    api.bookmarks.getBookmarks,{
      folderId: selectedFolderIdStore as any,
      tagId: undefined as any,
    }

  ) || [];

  const userFolders = useConvexQuery(api.bookmarks.getUserFolders, isSignedIn ? {} : "skip") || [];
  const userTags = useConvexQuery(api.tags.getAllUserTags, isSignedIn ? {} : "skip") || []

  // Convex mutations
  const {mutate: createBookmarkMutation, isPending: createBookmarkMutationPending}= useMutation({
    mutationFn: useConvexMutation(api.bookmarks.createBookmark),
    onSuccess: () => {
      bookmarkActions.submitAddBookmarkForm();
    },
    onError: (error) => {
      console.error("Failed to create bookmark:", error);
    },
  });

  const {mutate: createFolderMutation, isPending: createFolderMutationPending}= useMutation({
    mutationFn: useConvexMutation(api.bookmarks.createFolder),
    onSuccess: () => {
      bookmarkActions.submitCreateFolderForm();
    },
    onError: (error) => {
      console.error("Failed to create folder:", error);
    },
  });

  const {mutate: addTagToBookmarkMutation, isPending: addTagToBookmarkMutationPending}= useMutation({
    mutationFn: useConvexMutation(api.tags.addTagToBookmark),
    onSuccess: () => {
      // bookmarkActions.submitAddTagToBookmarkForm();
    },
    onError: (error) => {
      console.error("Failed to add tag to bookmark:", error);
    },
  });

  const {mutate: removeTagFromBookmarkMutation}= useMutation({
    mutationFn: useConvexMutation(api.tags.removeTagFromBookmark),
    onSuccess: () => {
      console.log("Tag removed from bookmark");
      // bookmarkActions.submitRemoveTagFromBookmarkForm();
    },
    onError: (error) => {
      console.error("Failed to remove tag from bookmark:", error);
    },
  });


  if (!isSignedIn) {
    return <div>Sign in to continue</div>;
  }


  const handleCreateBookmark = async () => {
    if (!newBookmarkForm.url || !newBookmarkForm.title) {
      // Basic validation
      console.error("URL and Title are required.");
      return;
    }
    try {
      await createBookmarkMutation({
        title: newBookmarkForm.title,
        url: newBookmarkForm.url,
        description: newBookmarkForm.description,
        folderId: newBookmarkForm.folderId as Id<"folders"> | undefined, // Ensure type compatibility
        tags: newBookmarkForm.tags, // Will be implemented more thoroughly later
      });
      bookmarkActions.submitAddBookmarkForm(); // Closes dialog and resets form
    } catch (error) {
      console.error("Failed to create bookmark:", error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderForm.name) {
      console.error("Folder name is required.");
      return;
    }
    try {
      createFolderMutation({
        name: newFolderForm.name,
        // parentId: newFolderForm.parentId !== "root" ? newFolderForm.parentId as Id<"folders"> : undefined,
      });
      bookmarkActions.submitCreateFolderForm();
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate stats locally for now
  const totalBookmarks = bookmarks.length;
  const activeBookmarks = bookmarks.filter(b => !b.isArchived).length;
  const archivedBookmarks = bookmarks.filter(b => b.isArchived).length;
  const totalTagsCount = userTags.length;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 flex gap-6">
               {/* Main Content */}
        <div className="flex-1">
          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) =>
                    bookmarkActions.setSearchQuery(e.target.value)
                  }
                  className="pl-10 bg-white dark:bg-slate-800"
                />
              </div>
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
                          bookmarkActions.updateNewBookmarkForm({
                            url: e.target.value,
                          })
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
                          bookmarkActions.updateNewBookmarkForm({
                            title: e.target.value,
                          })
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
                          bookmarkActions.updateNewBookmarkForm({ folderId: value === "root" ? null : value })
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
                    {/* Basic Tag input for now, will be enhanced later */}
                    <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                            id="tags"
                            placeholder="e.g., react, typescript, cool"
                            value={newBookmarkForm.tags.join(", ")}
                            onChange={(e) => bookmarkActions.updateNewBookmarkForm({ tags: e.target.value.split(",").map(tag => tag.trim()) })}
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
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
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
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Bookmarks
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {totalBookmarks}
                    </p>
                  </div>
                  <Bookmark className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Active
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {activeBookmarks}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Archived
                    </p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {archivedBookmarks}
                    </p>
                  </div>
                  <Archive className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Total Tags
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {totalTagsCount}
                    </p>
                  </div>
                  <Tag className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Folder Management */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Folders</h2>
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
                          bookmarkActions.updateNewFolderForm({
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="parentFolder">
                        Parent Folder (Optional)
                      </Label>
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
                          <SelectItem value="root">
                            No parent (root level)
                          </SelectItem>
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
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Root Folder Card */}
              <Card
                className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${selectedFolderIdStore === null ? "border-indigo-600" : "border-slate-200 dark:border-slate-600"} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700`}
                onClick={() => bookmarkActions.setSelectedFolder(null) }
              >
                <CardContent className="p-4 text-center">
                  <Home className="h-8 w-8 mx-auto mb-2 text-indigo-600 group-hover:text-indigo-700" />
                  <p className="text-sm font-medium truncate">Root</p>
                  {/* Optionally, count bookmarks in root */}
                </CardContent>
              </Card>

              {userFolders.map((folder) => (
                <Card
                  key={folder._id}
                  className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-2 ${selectedFolderIdStore === folder._id ? "border-indigo-600" : "border-slate-200 dark:border-slate-600"} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700`}
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


          {/* Bookmarks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <Card
                key={bookmark._id}
                className="group hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 border-0 shadow-sm hover:-translate-y-1"
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={bookmark.bookmarkContent?.ogData?.image || `https://avatar.vercel.sh/${bookmark._id}.svg?text=${bookmark.title}`}
                    alt={bookmark.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {bookmark.isArchived && (
                    <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600">
                      <Archive className="h-3 w-3 mr-1" />
                      Archived
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex-grow">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {bookmark.title}
                      </CardTitle>
                    </a>
                    <div className="flex-shrink-0 space-x-1">
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditTagsDialog({ isOpen: true, bookmark: bookmark, newTagName: "" })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(bookmark.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 pt-1">
                    {bookmark.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {bookmark.summary && (
                    <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        <span className="font-medium">AI Summary:</span>{" "}
                        {bookmark.summary}
                      </p>
                    </div>
                  )}
                  {/* User-managed Tags */}
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="mb-2">
                      <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Your Tags:</h4>
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.map((tag) => (
                          <Badge key={tag._id} variant="default" className="text-xs bg-sky-500 hover:bg-sky-600">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* AI Suggested Tags */}
                  {bookmark.bookmarkContent?.aiSuggestedTags && bookmark.bookmarkContent.aiSuggestedTags.length > 0 && (
                    <div className="mb-3">
                       <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Suggested:</h4>
                       <div className="flex flex-wrap gap-1">
                        {bookmark.bookmarkContent.aiSuggestedTags.slice(0, 3).map((tag, index) => (
                          <Badge key={`ai-${index}-${tag}`} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.bookmarkContent.aiSuggestedTags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{bookmark.bookmarkContent.aiSuggestedTags.length - 3}
                            </Badge>
                          )}
                      </div>
                    </div>
                  )}

                  <Separator className="mb-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(bookmark.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      {new URL(bookmark.url).hostname}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {bookmarks.length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          )}
        </div>
      </div>

      {/* Edit Tags Dialog */}
      {editTagsDialog.isOpen && editTagsDialog.bookmark && (
        <Dialog
          open={editTagsDialog.isOpen}
          onOpenChange={(isOpen) =>
            setEditTagsDialog({ ...editTagsDialog, isOpen })
          }
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tags for: {editTagsDialog.bookmark.title}</DialogTitle>
              <DialogDescription>
                Manage tags for this bookmark. Click a tag to remove it, or type to add a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {editTagsDialog.bookmark.tags.map((tag) => (
                  <Badge
                    key={tag._id}
                    variant="default"
                    className="text-sm pr-1 cursor-pointer bg-sky-500 hover:bg-sky-600"
                    onClick={async () => {
                      try {
                        await removeTagFromBookmarkMutation({
                          bookmarkId: editTagsDialog.bookmark!._id,
                          tagId: tag._id,
                        });
                        // Optimistically update UI or rely on Convex refetch
                        setEditTagsDialog(prev => ({
                            ...prev,
                            bookmark: prev.bookmark ? {
                                ...prev.bookmark,
                                tags: prev.bookmark.tags.filter(t => t._id !== tag._id)
                            } : null
                        }));
                      } catch (error) {
                        console.error("Failed to remove tag:", error);
                      }
                    }}
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
                  value={editTagsDialog.newTagName}
                  onChange={(e) =>
                    setEditTagsDialog({
                      ...editTagsDialog,
                      newTagName: e.target.value,
                    })
                  }
                  onKeyPress={async (e) => {
                    if (e.key === "Enter" && editTagsDialog.newTagName.trim() && editTagsDialog.bookmark) {
                      try {
                        await addTagToBookmarkMutation({
                          bookmarkId: editTagsDialog.bookmark._id,
                          tagName: editTagsDialog.newTagName.trim(),
                        });
                        // Optimistically add or rely on refetch. For now, clear input.
                        // A full solution would update editTagsDialog.bookmark.tags
                        setEditTagsDialog(prev => ({ ...prev, newTagName: ""}));
                      } catch (error) {
                        console.error("Failed to add tag:", error);
                      }
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={!editTagsDialog.newTagName.trim() || addTagToBookmarkMutationPending}
                  onClick={async () => {
                    if (editTagsDialog.newTagName.trim() && editTagsDialog.bookmark) {
                       try {
                        await addTagToBookmarkMutation({
                          bookmarkId: editTagsDialog.bookmark._id,
                          tagName: editTagsDialog.newTagName.trim(),
                        });
                        setEditTagsDialog(prev => ({ ...prev, newTagName: ""}));
                      } catch (error) {
                        console.error("Failed to add tag:", error);
                      }
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setEditTagsDialog({ isOpen: false, bookmark: null, newTagName: "" })}
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
