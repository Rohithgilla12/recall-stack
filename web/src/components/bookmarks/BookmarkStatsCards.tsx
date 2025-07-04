import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Globe, Archive, Tag } from "lucide-react";

interface BookmarkStatsCardsProps {
  totalBookmarks: number;
  activeBookmarks: number;
  archivedBookmarks: number;
  totalTagsCount: number;
}

export function BookmarkStatsCards({
  totalBookmarks,
  activeBookmarks,
  archivedBookmarks,
  totalTagsCount,
}: BookmarkStatsCardsProps) {
  return (
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
  );
}
