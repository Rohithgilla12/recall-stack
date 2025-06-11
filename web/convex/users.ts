import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const createUser = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		image: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()

		if (!identity) {
			throw new Error("Unauthorized")
		}

		return await ctx.db.insert("users", {
			...args,
			clerkUserId: identity.subject,
		})
	},
})

export const me = query({
	handler: async (ctx, _) => {
		const identity = await ctx.auth.getUserIdentity()

		if (!identity) {
			throw new Error("Unauthorized")
		}

		return await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) =>
				q.eq("clerkUserId", identity.subject),
			)
			.unique()
	},
})
