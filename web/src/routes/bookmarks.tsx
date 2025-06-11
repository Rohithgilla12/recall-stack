import { createFileRoute } from "@tanstack/react-router"
import BookmarkDashboard from "../../bookmark-dashboard"

export const Route = createFileRoute("/bookmarks")({
	component: BookmarkDashboard,
})
