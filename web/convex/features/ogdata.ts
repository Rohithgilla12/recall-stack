import { internalAction } from "convex/_generated/server"
import { v } from "convex/values"

const ogDataSchema = v.object({
	content: v.string(),
	excerpt: v.string(),
	length: v.number(),
	markdown: v.string(),
	open_graph: v.object({
		description: v.optional(v.string()),
		image: v.optional(v.string()),
		locale: v.string(),
		title: v.optional(v.string()),
		twitter_card: v.optional(v.string()),
		twitter_image: v.optional(v.string()),
		url: v.string(),
	}),
	success: v.boolean(),
	title: v.string(),
	url: v.string(),
})

export const generateOgData = internalAction({
	args: {
		url: v.string(),
	},
	returns: ogDataSchema,
	handler: async (_, args) => {
		const { url } = args

		const pageZenApiUrl = process.env.PAGE_ZEN_API_URL
		if (!pageZenApiUrl) {
			throw new Error("PAGE_ZEN_API_URL is not set")
		}

		const response = await fetch(`${pageZenApiUrl}/extract`, {
			method: "POST",
			body: JSON.stringify({ url, include_markdown: true }),
		})

		const data = await response.json()

		if (!data.success) {
			throw new Error("Failed to generate OG data")
		}

		// Doing this so that convex doesn't throw ` Object contains extra field `site_name` that is not in the validator`
		return {
			content: data.content,
			excerpt: data.excerpt,
			length: data.length,
			markdown: data.markdown,
			open_graph: {
				description: data.open_graph.description,
				image: data.open_graph.image,
				locale: data.open_graph.locale,
				title: data.open_graph.title,
				twitter_card: data.open_graph.twitter_card,
				twitter_image: data.open_graph.twitter_image,
				url: data.open_graph.url,
			},
			success: data.success,
			title: data.title,
			url: data.url,
		}
	},
})
