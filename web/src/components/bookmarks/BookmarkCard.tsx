import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Id } from "convex/_generated/dataModel";
import {
  Archive,
  Calendar,
  ExternalLink,
  Globe,
  Pencil,
} from "lucide-react";
import type { BookmarkTypeForEditDialog } from "./EditTagsDialog"; // Import the specific type

// Define TagType locally or import from a shared types file if available
type TagType = { _id: Id<"tags">; name: string };

// This is the full bookmark type expected by this card
export type BookmarkCardType = {
  _id: Id<"bookmarks">;
  title: string;
  url: string;
  description?: string;
  isArchived?: boolean;
  createdAt: number;
  folderId?: Id<"folders">; // Not directly used in card display but good for type consistency
  tags: TagType[]; // User-managed tags
  bookmarkContent?: {
    ogData?: { image?: string };
    aiSuggestedTags?: string[];
  } | null;
  summary?: string;
};

interface BookmarkCardProps {
  bookmark: BookmarkCardType;
  onEditTags: (bookmark: BookmarkTypeForEditDialog) => void;
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function BookmarkCard({ bookmark, onEditTags }: BookmarkCardProps) {
  const handleEditTagsClick = () => {
    // Pass only the necessary fields to the onEditTags handler
    onEditTags({
      _id: bookmark._id,
      title: bookmark.title,
      tags: bookmark.tags,
    });
  };

  return (
    <Card
      key={bookmark._id}
      className="group hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 border-0 shadow-sm hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={
            bookmark.bookmarkContent?.ogData?.image ||
            `https://avatar.vercel.sh/${bookmark._id}.svg?text=${encodeURIComponent(bookmark.title)}`
          }
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
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-grow"
          >
            <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {bookmark.title}
            </CardTitle>
          </a>
          <div className="flex-shrink-0 space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
              onClick={handleEditTagsClick}
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
            <h4 className="text-xs font-semibold mb-1 text-muted-foreground">
              Your Tags:
            </h4>
            <div className="flex flex-wrap gap-1">
              {bookmark.tags.map((tag) => (
                <Badge
                  key={tag._id}
                  variant="default"
                  className="text-xs bg-sky-500 hover:bg-sky-600"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {/* AI Suggested Tags */}
        {bookmark.bookmarkContent?.aiSuggestedTags &&
          bookmark.bookmarkContent.aiSuggestedTags.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold mb-1 text-muted-foreground">
                Suggested:
              </h4>
              <div className="flex flex-wrap gap-1">
                {bookmark.bookmarkContent.aiSuggestedTags
                  .slice(0, 3)
                  .map((tag, index) => (
                    <Badge
                      key={`ai-${index}-${tag}`}
                      variant="secondary"
                      className="text-xs"
                    >
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
  );
}
