import { createFileRoute, redirect } from "@tanstack/react-router"
import BookmarkDashboard from "../../bookmark-dashboard"

export const Route = createFileRoute("/bookmarks")({
	component: BookmarkDashboard,
	beforeLoad: async ({ context }) => {
		if (!context.userId) {
			throw redirect({ to: "/" })
		}
	},
})
