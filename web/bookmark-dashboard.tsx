import FolderTree from "@/components/rs/folder-tree";
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
  bookmarkStats,
  bookmarkStore,
} from "@/lib/bookmark-store";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Archive,
  Bookmark,
  Calendar,
  ExternalLink,
  Folder,
  FolderPlus,
  Globe,
  Plus,
  Search,
  Tag,
} from "lucide-react";

export default function BookmarkDashboard() {
  // Store subscriptions
  const searchQuery = useStore(bookmarkStore, (state) => state.searchQuery);
  const selectedTag = useStore(bookmarkStore, (state) => state.selectedTag);
  const selectedFolder = useStore(
    bookmarkStore,
    (state) => state.selectedFolder
  );
  const isAddDialogOpen = useStore(
    bookmarkStore,
    (state) => state.isAddDialogOpen
  );
  const isFolderDialogOpen = useStore(
    bookmarkStore,
    (state) => state.isFolderDialogOpen
  );
  const newBookmark = useStore(bookmarkStore, (state) => state.newBookmark);
  const newFolder = useStore(bookmarkStore, (state) => state.newFolder);
  const tags = useStore(bookmarkStore, (state) => state.tags);
  const folders = useStore(bookmarkStore, (state) => state.folders);

  const { mutate: createBookmarkMutation, isPending } = useMutation({
    mutationFn: useConvexMutation(api.bookmarks.createBookmark),
    onError: (error) => {
      console.error(error);
    },
  });

  // Derived state
  const bookmarks = useQuery(api.bookmarks.getBookmarks) || [];
  const stats = useStore(bookmarkStats);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar with Folder Tree */}
        <div className="w-64 flex-shrink-0">
          <Card className="bg-white dark:bg-slate-800 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Folders</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <FolderTree
                selectedFolder={selectedFolder}
                onSelectFolder={bookmarkActions.setSelectedFolder}
              />
            </CardContent>
          </Card>
        </div>

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
                        value={newBookmark.url}
                        onChange={(e) =>
                          bookmarkActions.updateNewBookmark({
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
                        value={newBookmark.title}
                        onChange={(e) =>
                          bookmarkActions.updateNewBookmark({
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
                        value={newBookmark.description}
                        onChange={(e) =>
                          bookmarkActions.updateNewBookmark({
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder">Folder</Label>
                      <Select
                        value={newBookmark.folder}
                        onValueChange={(value) =>
                          bookmarkActions.updateNewBookmark({ folder: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select folder" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder} value={folder}>
                              {folder}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      disabled={isPending}
                      onClick={() => {
                        try {
                          createBookmarkMutation({
                            title: newBookmark.title,
                            url: newBookmark.url,
                            description: newBookmark.description,
                          });
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      className="w-full"
                    >
                      Save Bookmark
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => bookmarkActions.setSelectedTag("all")}
                className="rounded-full"
              >
                All
              </Button>
              {tags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => bookmarkActions.setSelectedTag(tag)}
                  className="rounded-full"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
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
                      {stats.total}
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
                      {stats.active}
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
                      {stats.archived}
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
                      Tags
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {stats.totalTags}
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
                        value={newFolder.name}
                        onChange={(e) =>
                          bookmarkActions.updateNewFolder({
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
                        value={newFolder.parentId || ""}
                        onValueChange={(value) =>
                          bookmarkActions.updateNewFolder({
                            parentId: value || null,
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
                          {folders.map((folder) => (
                            <SelectItem key={folder} value={folder}>
                              {folder}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={bookmarkActions.createFolder}
                      className="w-full"
                    >
                      Create Folder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((folder) => (
                <Card
                  key={folder}
                  className="group hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600"
                  onClick={() => bookmarkActions.setSelectedFolder(folder)}
                >
                  <CardContent className="p-4 text-center">
                    <Folder className="h-8 w-8 mx-auto mb-2 text-indigo-600 group-hover:text-indigo-700" />
                    <p className="text-sm font-medium truncate">{folder}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(Math.random() * 10) + 1} items
                    </p>
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
                    src={bookmark.imageUrl || "/placeholder.svg"}
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
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {bookmark.title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">
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
                  <div className="flex flex-wrap gap-1 mb-3">
                    {bookmark.aiSuggestedTags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {bookmark.aiSuggestedTags?.length &&
                      bookmark.aiSuggestedTags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{bookmark.aiSuggestedTags.length - 3}
                        </Badge>
                      )}
                  </div>
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
                {searchQuery || selectedTag !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first bookmark"}
              </p>
              <Button onClick={() => bookmarkActions.setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Bookmark
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
