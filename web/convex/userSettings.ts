import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

/**
 * Get user settings for the current user
 */
export const getUserSettings = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
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

		const settings = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first()

		return settings
	},
})

/**
 * Update Kindle email address
 */
export const updateKindleEmail = mutation({
	args: {
		kindleEmail: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
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

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(args.kindleEmail)) {
			throw new Error("Invalid email address")
		}

		// Check if settings exist
		const existingSettings = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first()

		if (existingSettings) {
			// Update existing settings
			await ctx.db.patch(existingSettings._id, {
				kindleEmail: args.kindleEmail,
			})
			return existingSettings._id
		}

		// Create new settings
		const settingsId = await ctx.db.insert("userSettings", {
			userId: user._id,
			kindleEmail: args.kindleEmail,
			isKindleEnabled: true,
			digestFrequency: "manual",
		})

		return settingsId
	},
})

/**
 * Update digest frequency
 */
export const updateDigestFrequency = mutation({
	args: {
		frequency: v.union(
			v.literal("manual"),
			v.literal("daily"),
			v.literal("weekly"),
			v.literal("monthly"),
		),
		time: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
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

		// Check if settings exist
		const existingSettings = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first()

		if (!existingSettings) {
			throw new Error("User settings not found. Please set Kindle email first.")
		}

		// Update settings
		await ctx.db.patch(existingSettings._id, {
			digestFrequency: args.frequency,
			digestTime: args.time,
		})

		return existingSettings._id
	},
})

/**
 * Toggle Kindle feature on/off
 */
export const toggleKindleEnabled = mutation({
	args: {
		enabled: v.boolean(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
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

		// Check if settings exist
		const existingSettings = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first()

		if (!existingSettings) {
			throw new Error("User settings not found. Please set Kindle email first.")
		}

		// Update settings
		await ctx.db.patch(existingSettings._id, {
			isKindleEnabled: args.enabled,
		})

		return existingSettings._id
	},
})

/**
 * Update last digest sent timestamp
 */
export const updateLastDigestSent = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
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

		const settings = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", user._id))
			.first()

		if (!settings) {
			throw new Error("User settings not found")
		}

		await ctx.db.patch(settings._id, {
			lastDigestSent: Date.now(),
		})

		return settings._id
	},
})
