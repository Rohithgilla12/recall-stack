import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	users: defineTable({
		name: v.string(),
		email: v.string(),
		image: v.optional(v.string()),
		clerkUserId: v.optional(v.string()),
	})
		.index("by_email", ["email"])
		.index("by_clerk_user_id", ["clerkUserId"]),

	bookmarks: defineTable({
		userId: v.id("users"),
		url: v.string(),
		title: v.string(),
		description: v.optional(v.string()),
		content: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
		isArchived: v.optional(v.boolean()),
		archivedUrl: v.optional(v.string()),
		createdAt: v.number(),
		summary: v.optional(v.string()),
		embeddingId: v.optional(v.id("vectorEmbeddings")),
	})
		.index("by_userId", ["userId", "createdAt"])
		.index("by_url_and_userId", ["userId", "url"])
		.index("by_url", ["url"]),

	bookmarkContent: defineTable({
		bookmarkId: v.id("bookmarks"),
		content: v.string(),
		markdown: v.optional(v.string()),
		cleanedContent: v.optional(v.string()),
		aiSuggestedTags: v.optional(v.array(v.string())),
		createdAt: v.number(),
	}).index("by_bookmarkId", ["bookmarkId"]),

	tags: defineTable({
		userId: v.id("users"),
		name: v.string(),
	}).index("by_userId_and_name", ["userId", "name"]),

	bookmarkTags: defineTable({
		bookmarkId: v.id("bookmarks"),
		tagId: v.id("tags"),
		userId: v.id("users"),
	})
		.index("by_bookmarkId", ["bookmarkId"])
		.index("by_tagId", ["tagId"])
		.index("by_userId_and_tagId", ["userId", "tagId"])
		.index("by_bookmarkId_and_tagId", ["bookmarkId", "tagId"]),

	folders: defineTable({
		userId: v.id("users"),
		name: v.string(),
		parentId: v.optional(v.id("folders")),
		createdAt: v.number(),
	})
		.index("by_userId_and_name", ["userId", "name"])
		.index("by_userId_and_parentId", ["userId", "parentId"]),

	vectorEmbeddings: defineTable({
		bookmarkId: v.id("bookmarks"),
		embedding: v.array(v.number()),
		createdAt: v.number(),
	}).index("by_bookmarkId", ["bookmarkId"]),
})
