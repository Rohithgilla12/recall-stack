import { workflow } from "convex"
import { internal } from "convex/_generated/api"
import { v } from "convex/values"

export const generateOgDataWorkflow = workflow.define({
	args: {
		bookmarkId: v.id("bookmarks"),
	},
	handler: async (steps, args) => {
		const { bookmarkId } = args

		const bookmark = await steps.runQuery(internal.bookmarks.bookmarkQuery, {
			bookmarkId,
		})

		if (!bookmark) {
			throw new Error("Bookmark not found")
		}

		return bookmark
	},
})
