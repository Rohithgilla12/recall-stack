import { workflow } from "convex"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"

export const getBookmarks = query({
	args: {},
	handler: async (ctx, _) => {
		const identity = await ctx.auth.getUserIdentity()

		if (!identity) {
			throw new Error("Unauthorized")
		}

		const userId = identity.subject

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", userId))
			.unique()

		if (!user) {
			throw new Error("User not found")
		}

		const bookmarks = await ctx.db
			.query("bookmarks")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.collect()

		const bookmarkContent = await Promise.all(
			bookmarks.map(async (bookmark) => {
				if (!bookmark.bookmarkContentId) {
					return {
						...bookmark,
						bookmarkContent: null,
					}
				}
				const contentDoc = await ctx.db // Renamed to avoid confusion
					.query("bookmarkContent")
					// biome-ignore lint/style/noNonNullAssertion: Already checked if bookmarkContentId is not null
					.withIndex("by_id", (q) => q.eq("_id", bookmark.bookmarkContentId!))
					.unique()

				return {
					...bookmark, // Includes original bookmark fields (like its own summary if any)
					bookmarkContent: contentDoc,
					// Prioritize AI-generated summary from bookmarkContent if it exists
					summary: bookmark.summary,
				}
			}),
		)
		// The variable name bookmarkContent is a bit misleading here, it's bookmarksWithContent
		return bookmarkContent
	},
})

export const getUserFolders = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("folders")
			.withIndex("by_userId_and_parentId", (q) => q.eq("userId", args.userId))
			.collect()
	},
})

export const createFolder = mutation({
	args: {
		name: v.string(),
		parentId: v.optional(v.id("folders")),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("folders", {
			...args,
			createdAt: Date.now(),
		})
	},
})

export const createBookmark = mutation({
	args: {
		title: v.string(),
		url: v.string(),
		folderId: v.optional(v.id("folders")),
		description: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
		isArchived: v.optional(v.boolean()),
		archivedUrl: v.optional(v.string()),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		let userId: Id<"users"> | null = null

		if (args.userId) {
			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.userId))
				.unique()

			if (!user) {
				throw new Error("User not found")
			}
			userId = user._id
		} else {
			const identity = await ctx.auth.getUserIdentity()

			if (!identity) {
				throw new Error("Unauthorized")
			}

			const user = await ctx.db
				.query("users")
				.withIndex("by_clerk_user_id", (q) =>
					q.eq("clerkUserId", identity.subject),
				)
				.unique()

			if (!user) {
				throw new Error("User not found")
			}

			userId = user._id
		}

		const response = await ctx.db.insert("bookmarks", {
			...args,
			userId,
			createdAt: Date.now(),
		})

		await workflow.start(ctx, internal.bookmark_workflow.bookmarkContentFlow, {
			bookmarkId: response,
		})

		return response
	},
})

export const bookmarkQuery = internalQuery({
	args: {
		bookmarkId: v.id("bookmarks"),
	},
	handler: async (ctx, args) => {
		const { bookmarkId } = args
		const bookmark = await ctx.db
			.query("bookmarks")
			.withIndex("by_id", (q) => q.eq("_id", bookmarkId))
			.unique()

		if (!bookmark) {
			throw new Error("Bookmark not found")
		}

		const bookmarkContent = await ctx.db
			.query("bookmarkContent")
			.withIndex("by_url", (q) => q.eq("url", bookmark.url))
			.unique()

		return {
			bookmark,
			bookmarkContent,
		}
	},
})

export const updateBookmark = internalMutation({
	args: {
		bookmarkId: v.id("bookmarks"),
		bookmarkContentId: v.id("bookmarkContent"),
	},
	handler: async (ctx, args) => {
		const { bookmarkId, bookmarkContentId } = args

		const bookmarkContent = await ctx.db.patch(bookmarkId, {
			bookmarkContentId,
		})

		return bookmarkContent
	},
})

export const createBookmarkContent = internalMutation({
	args: {
		content: v.string(),
		url: v.string(),
		markdown: v.optional(v.string()),
		cleanedContent: v.optional(v.string()),
		summary: v.optional(v.string()),
		aiSuggestedTags: v.optional(v.array(v.string())),
		ogData: v.optional(
			v.object({
				title: v.optional(v.string()),
				description: v.optional(v.string()),
				image: v.optional(v.string()),
				url: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const {
			content,
			url,
			markdown,
			cleanedContent,
			aiSuggestedTags,
			summary,
			ogData,
		} = // Added summary to destructuring
			args

		const bookmarkContent = await ctx.db.insert("bookmarkContent", {
			content,
			url,
			markdown,
			cleanedContent,
			aiSuggestedTags,
			summary,
			ogData: {
				title: ogData?.title || "",
				description: ogData?.description || "",
				image: ogData?.image || "",
				url: ogData?.url || "",
			},
			createdAt: Date.now(),
		})

		return bookmarkContent
	},
})
