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

		console.log("response", response.markdown)

		// Call the new AI action
		const aiData = await step.runAction(internal.ai.generateSummaryAndTags, {
			content: response.markdown,
			userId: bookmark.userId,
		})

		let summaryToStore = undefined
		let tagsToStore: string[] = []

		if (aiData) {
			if (aiData.error) {
				console.warn(
					`AI processing failed for ${bookmark.url}: ${aiData.error}`,
				)
			} else {
				summaryToStore = aiData.summary ?? undefined
				tagsToStore = aiData.tags || []
			}
		} else {
			console.warn(`AI processing returned no data for ${bookmark.url}`)
			summaryToStore = "AI processing did not return data."
		}

		const createdBookmarkContent = await step.runMutation(
			internal.bookmarks.createBookmarkContent,
			{
				content: response.content,
				url: bookmark.url,
				markdown: response.markdown,
				cleanedContent: response.content,
				summary: summaryToStore,
				aiSuggestedTags: tagsToStore, // Add tags from AI action
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
