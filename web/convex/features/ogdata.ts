import { internalAction } from "convex/_generated/server"
import { v } from "convex/values"

export const generateOgData = internalAction({
	args: {
		url: v.string(),
	},
	returns: v.object({
		content: v.string(),
		excerpt: v.string(),
		length: v.number(),
		markdown: v.string(),
		open_graph: v.object({
			description: v.string(),
			image: v.string(),
			locale: v.string(),
			title: v.string(),
			twitter_card: v.string(),
			twitter_image: v.string(),
			url: v.string(),
		}),
		success: v.boolean(),
		title: v.string(),
		url: v.string(),
	}),
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

		return data
	},
})
