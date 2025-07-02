import { workflow } from "convex"
import { internal } from "convex/_generated/api"
import { v } from "convex/values"
import { mutation } from "./_generated/server"

export const kickoffBookmarkWorkflow = mutation({
	args: {
		bookmarkId: v.id("bookmarks"),
	},
	handler: async (ctx, args) => {
		await workflow.start(ctx, internal.bookmark_workflow.bookmarkContentFlow, {
			bookmarkId: args.bookmarkId,
		})
	},
})

export const bookmarkContentFlow = workflow.define({
	args: {
		bookmarkId: v.id("bookmarks"),
	},
	returns: v.object({
		status: v.boolean(),
	}),
	handler: async (step, args) => {
		const { bookmarkId } = args

		const { bookmark, bookmarkContent } = await step.runQuery(
			internal.bookmarks.bookmarkQuery,
			{
				bookmarkId,
			},
		)

		if (!bookmark) {
			throw new Error("Bookmark not found")
		}

		if (bookmarkContent) {
			await step.runMutation(internal.bookmarks.updateBookmark, {
				bookmarkId,
				bookmarkContentId: bookmarkContent._id,
			})
			return { status: true }
		}

		const response = await step.runAction(
			internal.features.ogdata.generateOgData,
			{
				url: bookmark.url,
			},
		)

		const createdBookmarkContent = await step.runMutation(
			internal.bookmarks.createBookmarkContent,
			{
				content: response.content,
				url: bookmark.url,
				markdown: response.markdown,
				cleanedContent: response.content,
				// TODO: add ai suggested tags
				aiSuggestedTags: [],
				ogData: {
					title: response.title,
					description: response.open_graph.description,
					image: response.open_graph.image,
					url: response.url,
				},
			},
		)

		await step.runMutation(internal.bookmarks.updateBookmark, {
			bookmarkId,
			bookmarkContentId: createdBookmarkContent,
		})

		return { status: true }
	},
})
