"use node"

import { internalAction } from "convex/_generated/server"
import { v } from "convex/values"
import ogs from "open-graph-scraper"

export const generateOgData = internalAction({
	args: {
		url: v.string(),
	},
	handler: async (_, args) => {
		const { url } = args

		const ogData = await ogs({ url })

		if (ogData.error) {
			throw new Error("No Open Graph data found")
		}

		return {
			title: ogData.result.ogTitle,
			description: ogData.result.ogDescription,
			image: ogData.result.ogImage?.[0]?.url,
			url: ogData.result.ogUrl,
			type: ogData.result.ogType,
			siteName: ogData.result.ogSiteName || "",
			locale: ogData.result.ogLocale,
		}
	},
})
