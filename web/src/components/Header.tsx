import { Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import ClerkHeader from "../integrations/clerk/header-user.tsx";
import { useAuth } from "@clerk/clerk-react";

export default function Header() {
  const { isSignedIn } = useAuth();

  return (
    <header className="p-4 flex items-center justify-between bg-white dark:bg-slate-800 shadow-md">
      <Link to="/" className="flex items-center space-x-2">
        <Bookmark className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Recall Stack
        </h1>
      </Link>

      <nav className="flex items-center space-x-4">
        {isSignedIn && (
          <Link
            to="/bookmarks"
            className="text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 px-3 py-2 rounded-md transition-colors"
            activeProps={{ className: "text-blue-600 dark:text-blue-500 bg-slate-100 dark:bg-slate-700" }}
          >
            My Bookmarks
          </Link>
        )}
        {/* Add other essential navigation links here if needed in the future */}
      </nav>

      <div>
        <ClerkHeader />
      </div>
    </header>
  );
}
