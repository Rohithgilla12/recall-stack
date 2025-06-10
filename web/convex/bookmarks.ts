import { v } from "convex/values"
import { query } from "./_generated/server"

export const getBookmarks = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const bookmarks = await ctx.db
			.query("bookmarks")
			.filter((q) => q.eq(q.field("userId"), args.userId))
			.collect()
		return bookmarks
	},
})
