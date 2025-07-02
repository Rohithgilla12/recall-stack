import { workflow } from "convex"
import { internal } from "convex/_generated/api"
import { v } from "convex/values"

export const bookmarkContentFlow = workflow.define({
	args: {
		bookmarkId: v.id("bookmarks"),
	},
	returns: v.object({
		status: v.boolean(),
	}),
	handler: async (step, args) => {
		const { bookmarkId } = args

		const bookmark = await step.runQuery(internal.bookmarks.bookmarkQuery, {
			bookmarkId,
		})

		if (!bookmark) {
			throw new Error("Bookmark not found")
		}

		return { status: true }
	},
})
