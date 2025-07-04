import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Query to get all unique tags for the current user
export const getAllUserTags = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			return [] // Or throw new Error("Unauthorized")
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
			.query("tags")
			.withIndex("by_userId_and_name", (q) => q.eq("userId", user._id))
			.collect()
	},
})

// Query to get tags for a specific bookmark
export const getTagsForBookmark = query({
	args: { bookmarkId: v.id("bookmarks") },
	handler: async (ctx, args) => {
		const bookmarkTags = await ctx.db
			.query("bookmarkTags")
			.withIndex("by_bookmarkId", (q) => q.eq("bookmarkId", args.bookmarkId))
			.collect()

		const tagIds = bookmarkTags.map((bt) => bt.tagId)
		const tags = await Promise.all(
			tagIds.map(async (tagId) => {
				const tagDoc = await ctx.db.get(tagId)
				return tagDoc ? { _id: tagDoc._id, name: tagDoc.name, userId: tagDoc.userId } : null
			}),
		)
		return tags.filter(tag => tag !== null) as { _id: Id<"tags">, name: string, userId: Id<"users"> }[]
	},
})

// Mutation to add a tag to a bookmark
export const addTagToBookmark = mutation({
	args: {
		bookmarkId: v.id("bookmarks"),
		tagName: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Unauthorized")
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique()
		if (!user) {
			throw new Error("User not found")
		}

		const bookmark = await ctx.db.get(args.bookmarkId)
		if (!bookmark || bookmark.userId !== user._id) {
			throw new Error("Bookmark not found or access denied")
		}

		if (args.tagName.trim() === "") {
			throw new Error("Tag name cannot be empty")
		}

		// Check if tag exists for this user
		let tag = await ctx.db
			.query("tags")
			.withIndex("by_userId_and_name", (q) =>
				q.eq("userId", user._id).eq("name", args.tagName.trim()),
			)
			.unique()

		let tagIdToLink: Id<"tags">
		if (!tag) {
			tagIdToLink = await ctx.db.insert("tags", {
				userId: user._id,
				name: args.tagName.trim(),
			})
		} else {
			tagIdToLink = tag._id
		}

		// Link bookmark with tag, avoid duplicates
		const existingLink = await ctx.db
			.query("bookmarkTags")
			.withIndex("by_bookmarkId_and_tagId", (q) =>
				q.eq("bookmarkId", args.bookmarkId).eq("tagId", tagIdToLink),
			)
			.unique()

		if (existingLink) {
			// Tag already linked to this bookmark
			return { success: true, message: "Tag already exists on bookmark." }
		}

		await ctx.db.insert("bookmarkTags", {
			bookmarkId: args.bookmarkId,
			tagId: tagIdToLink,
			userId: user._id, // For easier querying/cleanup if needed
		})
		return { success: true, tagId: tagIdToLink, tagName: args.tagName.trim() }
	},
})

// Mutation to remove a tag from a bookmark
export const removeTagFromBookmark = mutation({
	args: {
		bookmarkId: v.id("bookmarks"),
		tagId: v.id("tags"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Unauthorized")
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique()
		if (!user) {
			throw new Error("User not found")
		}

		const bookmark = await ctx.db.get(args.bookmarkId)
		if (!bookmark || bookmark.userId !== user._id) {
			throw new Error("Bookmark not found or access denied")
		}

		const linkToDelete = await ctx.db
			.query("bookmarkTags")
			.withIndex("by_bookmarkId_and_tagId", (q) =>
				q.eq("bookmarkId", args.bookmarkId).eq("tagId", args.tagId),
			)
			.filter(q => q.eq(q.field("userId"), user._id)) // Ensure user owns the link
			.unique()

		if (linkToDelete) {
			await ctx.db.delete(linkToDelete._id)
			return { success: true }
		}
		return { success: false, message: "Tag link not found." }
	},
})

// Mutation to delete a tag entirely (if unused or explicitly requested)
// For now, this will delete a tag and all its associations.
// A safer version might check if the tag is used before deleting.
export const deleteTag = mutation({
	args: { tagId: v.id("tags") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Unauthorized")
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique()
		if (!user) {
			throw new Error("User not found")
		}

		const tagToDelete = await ctx.db.get(args.tagId)
		if (!tagToDelete || tagToDelete.userId !== user._id) {
			throw new Error("Tag not found or access denied")
		}

		// Delete all bookmarkTags associated with this tag
		const bookmarkTagLinks = await ctx.db
			.query("bookmarkTags")
			.withIndex("by_tagId", (q) => q.eq("tagId", args.tagId))
			.collect()

		for (const link of bookmarkTagLinks) {
			// Could add an extra check here for link.userId === user._id if paranoid
			await ctx.db.delete(link._id)
		}

		await ctx.db.delete(args.tagId)
		return { success: true }
	},
})

// Mutation to rename a tag
export const renameTag = mutation({
	args: {
		tagId: v.id("tags"),
		newName: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Unauthorized")
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique()
		if (!user) {
			throw new Error("User not found")
		}

		if (args.newName.trim() === "") {
			throw new Error("New tag name cannot be empty")
		}

		// Check if the new name conflicts with an existing tag for this user
		const existingTagWithNewName = await ctx.db
			.query("tags")
			.withIndex("by_userId_and_name", (q) =>
				q.eq("userId", user._id).eq("name", args.newName.trim()),
			)
			.unique()

		if (existingTagWithNewName && existingTagWithNewName._id !== args.tagId) {
			throw new Error("A tag with this name already exists.")
		}

		const tagToRename = await ctx.db.get(args.tagId)
		if (!tagToRename || tagToRename.userId !== user._id) {
			throw new Error("Tag not found or access denied")
		}

		await ctx.db.patch(args.tagId, { name: args.newName.trim() })
		return { success: true }
	},
})
