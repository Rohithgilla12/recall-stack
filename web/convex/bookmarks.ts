import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

export const getBookmarks = query({
	args: {},
	handler: async (ctx, _) => {
		const identity = await ctx.auth.getUserIdentity()

		if (!identity) {
			throw new Error("Unauthorized")
		}

		const userId = identity.subject

		const bookmarks = await ctx.db
			.query("bookmarks")
			.withIndex("by_userId", (q) => q.eq("userId", userId as Id<"users">))
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

		return await ctx.db.insert("bookmarks", {
			...args,
			userId: identity.subject as Id<"users">,
			createdAt: Date.now(),
		})
	},
})
