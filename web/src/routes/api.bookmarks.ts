import { createAPIFileRoute } from "@tanstack/react-start/api"
import { jwtDecode } from "jwt-decode"

import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../convex/_generated/api"

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
		// TODO: It's not clear from the Convex docs if/how the token should be used
		// with ConvexHttpClient when called from a backend route.
		// For now, we'll assume the `createBookmark` mutation handles auth
		// based on the session associated with the request to this API route,
		// which should be passed along by the browser extension.
		// This needs further investigation if auth fails.

		try {
			const { url, title, folderId, description, imageUrl, isArchived, archivedUrl } = await request.json()

			if (!url || !title) {
				return Response.json({ error: "URL and title are required" }, { status: 400 })
			}

			const convex = new ConvexHttpClient(process.env.PUBLIC_CONVEX_URL!)
			// Note: The `createBookmark` mutation in convex/bookmarks.ts
			// already handles getting the user identity from the session.
			// We don't need to explicitly pass the user ID here if the session is correctly propagated.
			const result = await convex.mutation(api.bookmarks.createBookmark, {
				url,
				title,
				folderId,
				description,
				imageUrl,
				isArchived,
				archivedUrl,
			})

			return Response.json({ success: true, bookmarkId: result })
		} catch (error) {
			console.error("Error creating bookmark:", error)
			let errorMessage = "Failed to create bookmark."
			if (error instanceof Error) {
				errorMessage = error.message;
			}
			return Response.json({ error: errorMessage }, { status: 500 })
		}
	},
})
