import { createAPIFileRoute } from "@tanstack/react-start/api"
import { jwtDecode } from "jwt-decode"

export const APIRoute = createAPIFileRoute("/api/bookmarks")({
	GET: async ({ request }) => {
		const jwt = request.headers.get("Authorization")
		if (!jwt) {
			return Response.json({ error: "Unauthorized" }, { status: 401 })
		}

		const token = jwt.split(" ")[1]
		const decoded = jwtDecode(token)

		return Response.json({
			message: `Hello, World! from ${request.url}`,
			decoded,
		})
	},
})
