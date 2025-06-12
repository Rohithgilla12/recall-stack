import { v } from "convex/values"
import { internalQuery, mutation, query } from "./_generated/server"

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

		return bookmarks
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

		return await ctx.db.insert("bookmarks", {
			...args,
			userId: user._id,
			createdAt: Date.now(),
		})
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

		return bookmark
	},
})
