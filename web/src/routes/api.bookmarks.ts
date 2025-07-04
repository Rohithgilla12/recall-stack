import { createAPIFileRoute } from "@tanstack/react-start/api"
import { jwtDecode } from "jwt-decode"

import { api } from "convex/_generated/api"
import { ConvexHttpClient } from "convex/browser"

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
	POST: async ({ request }) => {
		const jwt = request.headers.get("Authorization")
		if (!jwt) {
			return Response.json({ error: "Unauthorized" }, { status: 401 })
		}

		const token = jwt.split(" ")[1]
		const decoded = jwtDecode(token)
		const userId = decoded.sub

		try {
			const {
				url,
				title,
				folderId,
				description,
				imageUrl,
				isArchived,
				archivedUrl,
			} = await request.json()

			if (!url || !title) {
				return Response.json(
					{ error: "URL and title are required" },
					{ status: 400 },
				)
			}

			if (!process.env.VITE_CONVEX_URL) {
				throw new Error("VITE_CONVEX_URL is not set")
			}

			const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL)
			// Pass the userId extracted from the JWT to the mutation
			const result = await convex.mutation(api.bookmarks.createBookmark, {
				url,
				title,
				folderId,
				description,
				imageUrl,
				isArchived,
				archivedUrl,
				userId,
			})

			return Response.json({ success: true, bookmarkId: result })
		} catch (error) {
			console.error("Error creating bookmark:", error)
			let errorMessage = "Failed to create bookmark."
			if (error instanceof Error) {
				errorMessage = error.message
			}
			return Response.json({ error: errorMessage }, { status: 500 })
		}
	},
})
