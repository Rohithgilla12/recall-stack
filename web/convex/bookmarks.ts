import { workflow } from "convex"
import { v } from "convex/values"
import { internal } from "./_generated/api" // Added api
import type { Id } from "./_generated/dataModel"
import {
	internalMutation,
	internalQuery,
	mutation,
	query,
} from "./_generated/server"

export const getBookmarks = query({
	args: {
		folderId: v.optional(v.union(v.id("folders"), v.literal("root"), v.null())),
		tagId: v.optional(v.id("tags")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()

		if (!identity) {
			// Return empty array if not logged in, or throw error, depending on desired public behavior
			return []
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

		let bookmarksQuery = ctx.db
			.query("bookmarks")
			.withIndex("by_userId_and_folderId", (q) => q.eq("userId", user._id))

		if (args.folderId === "root") {
			bookmarksQuery = ctx.db
				.query("bookmarks")
				.withIndex("by_userId_and_folderId", (q) =>
					q.eq("userId", user._id).eq("folderId", undefined),
				) // folderId is undefined for root
		} else if (args.folderId) {
			bookmarksQuery = ctx.db
				.query("bookmarks")
				.withIndex("by_userId_and_folderId", (q) =>
					q
						.eq("userId", user._id)
						.eq("folderId", args.folderId as Id<"folders">),
				)
		} else {
			// No folderId filter or folderId is null/undefined, fetch all user's bookmarks across all folders
			// This might require a different index if we strictly use by_userId_and_folderId or iterate if not too many.
			// For now, let's use the existing by_userId index for "all bookmarks" scenario.
			// This part might need optimization based on expected data size and query patterns.
			// A simpler approach for "all" is to just use the by_userId index.
			bookmarksQuery = ctx.db
				.query("bookmarks")
				.withIndex("by_userId", (q) => q.eq("userId", user._id))
		}

		let filteredBookmarks = await bookmarksQuery.order("desc").collect()

		// If tagId is provided, further filter bookmarks by this tag
		if (args.tagId) {
			const bookmarkIdsWithTag = await ctx.db
				.query("bookmarkTags")
				.withIndex("by_tagId", (q) => q.eq("tagId", args.tagId as Id<"tags">))
				.filter((q) => q.eq(q.field("userId"), user._id)) // Ensure tag link belongs to user
				.collect()
				.then(
					(links) => new Set(links.map((link) => link.bookmarkId.toString())),
				)

			filteredBookmarks = filteredBookmarks.filter((bookmark) =>
				bookmarkIdsWithTag.has(bookmark._id.toString()),
			)
		}

		const bookmarksWithDetails = await Promise.all(
			filteredBookmarks.map(async (bookmark) => {
				let contentDoc = null
				if (bookmark.bookmarkContentId) {
					contentDoc = await ctx.db.get(bookmark.bookmarkContentId)
				}

				// Fetch tags for each bookmark
				const bookmarkTagEntries = await ctx.db
					.query("bookmarkTags")
					.withIndex("by_bookmarkId", (q) => q.eq("bookmarkId", bookmark._id))
					.collect()

				const tagIdsFromLinks = bookmarkTagEntries.map((bt) => bt.tagId)
				const tags = await Promise.all(
					tagIdsFromLinks.map(async (tagId) => {
						const tagDoc = await ctx.db.get(tagId)
						// Ensure the tag belongs to the user, though link check above should suffice
						return tagDoc && tagDoc.userId === user._id
							? { _id: tagDoc._id, name: tagDoc.name }
							: null
					}),
				)
				const validTags = tags.filter((tag) => tag !== null) as {
					_id: Id<"tags">
					name: string
				}[]

				return {
					...bookmark,
					bookmarkContent: contentDoc,
					summary: contentDoc?.summary || bookmark.summary,
					tags: validTags,
				}
			}),
		)
		return bookmarksWithDetails
	},
})

export const getUserFolders = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			return []
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

		return await ctx.db
			.query("folders")
			.withIndex("by_userId_and_parentId", (q) => q.eq("userId", user._id)) // Query by actual user._id
			.collect()
	},
})

export const createFolder = mutation({
	args: {
		name: v.string(),
		// parentId: v.optional(v.id("folders")),
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

		return await ctx.db.insert("folders", {
			userId: user._id,
			name: args.name,
			// parentId: args.parentId,
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
		tags: v.optional(v.array(v.string())),
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

		const { tags, ...bookmarkData } = args

		const bookmarkId = await ctx.db.insert("bookmarks", {
			title: bookmarkData.title,
			url: bookmarkData.url,
			userId: userId,
			folderId: bookmarkData.folderId,
			description: bookmarkData.description,
			imageUrl: bookmarkData.imageUrl,
			createdAt: Date.now(),
		})

		// Process tags
		if (tags && tags.length > 0) {
			for (const tagName of tags) {
				if (tagName.trim() === "") continue // Skip empty tags

				// Check if tag exists for this user
				const tag = await ctx.db
					.query("tags")
					.withIndex("by_userId_and_name", (q) =>
						q.eq("userId", userId).eq("name", tagName.trim()),
					)
					.unique()

				let tagIdToLink: Id<"tags">
				if (!tag) {
					// Create tag if it doesn't exist
					tagIdToLink = await ctx.db.insert("tags", {
						userId: userId,
						name: tagName.trim(),
					})
				} else {
					tagIdToLink = tag._id
				}

				// Link bookmark with tag, avoid duplicates
				const existingLink = await ctx.db
					.query("bookmarkTags")
					.withIndex("by_bookmarkId_and_tagId", (q) =>
						q.eq("bookmarkId", bookmarkId).eq("tagId", tagIdToLink),
					)
					.unique()

				if (!existingLink) {
					await ctx.db.insert("bookmarkTags", {
						bookmarkId: bookmarkId,
						tagId: tagIdToLink,
						userId: userId,
					})
				}
			}
		}

		await workflow.start(ctx, internal.bookmark_workflow.bookmarkContentFlow, {
			bookmarkId: bookmarkId,
		})

		return bookmarkId
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
