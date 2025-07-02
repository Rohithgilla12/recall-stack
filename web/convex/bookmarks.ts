import { workflow } from "convex"
import { v } from "convex/values"
import { internal } from "./_generated/api"
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
				const bookmarkContent = await ctx.db
					.query("bookmarkContent")
					// biome-ignore lint/style/noNonNullAssertion: Already checked if bookmarkContentId is not null
					.withIndex("by_id", (q) => q.eq("_id", bookmark.bookmarkContentId!))
					.unique()

				return {
					...bookmark,
					bookmarkContent,
				}
			}),
		)

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
	},
	handler: async (ctx, args) => {
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

		const response = await ctx.db.insert("bookmarks", {
			...args,
			userId: user._id,
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
		aiSuggestedTags: v.optional(v.array(v.string())),
		ogData: v.optional(
			v.object({
				title: v.string(),
				description: v.string(),
				image: v.string(),
				url: v.string(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const { content, url, markdown, cleanedContent, aiSuggestedTags, ogData } =
			args

		const bookmarkContent = await ctx.db.insert("bookmarkContent", {
			content,
			url,
			markdown,
			cleanedContent,
			aiSuggestedTags,
			ogData,
			createdAt: Date.now(),
		})

		return bookmarkContent
	},
})
