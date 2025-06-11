import { createFileRoute } from "@tanstack/react-router"
import BookmarkDashboard from "bookmark-dashboard"

export const Route = createFileRoute("/")({
	component: App,
})

function App() {
	return (
		<div>
			<BookmarkDashboard />
		</div>
	)
}
