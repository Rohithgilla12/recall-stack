import { v } from "convex/values"
import { action, internalQuery, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { Resend } from "resend"
import type { Id } from "./_generated/dataModel"

/**
 * Get bookmarks for digest by IDs
 */
export const getBookmarksForDigest = internalQuery({
	args: {
		bookmarkIds: v.array(v.id("bookmarks")),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const userId = args.userId

		const bookmarks = await Promise.all(
			args.bookmarkIds.map(async (bookmarkId) => {
				const bookmark = await ctx.db.get(bookmarkId)
				if (!bookmark || bookmark.userId !== userId) {
					return null
				}

				// Get bookmark content
				let bookmarkContent = null
				if (bookmark.bookmarkContentId) {
					bookmarkContent = await ctx.db.get(bookmark.bookmarkContentId)
				}

				return {
					...bookmark,
					content: bookmarkContent,
				}
			}),
		)

		// Filter out null values (bookmarks that don't exist or don't belong to user)
		return bookmarks.filter((b) => b !== null)
	},
})

/**
 * Format bookmark content for Kindle email
 */
function formatBookmarkForKindle(bookmark: {
	title: string
	url: string
	summary?: string
	content?: {
		cleanedContent?: string
		markdown?: string
	} | null
}): string {
	let html = `
    <article style="margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #ccc;">
      <h1 style="font-size: 24px; margin-bottom: 10px;">${bookmark.title}</h1>
      <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
        Source: <a href="${bookmark.url}">${bookmark.url}</a>
      </p>
  `

	// Add summary if available
	if (bookmark.summary) {
		html += `
      <div style="background-color: #f0f0f0; padding: 15px; margin-bottom: 15px; border-left: 3px solid #333;">
        <strong>Summary:</strong> ${bookmark.summary}
      </div>
    `
	}

	// Add cleaned content if available
	if (bookmark.content?.cleanedContent) {
		// Split content into paragraphs and wrap in <p> tags
		const paragraphs = bookmark.content.cleanedContent
			.split("\n\n")
			.filter((p) => p.trim())
			.map((p) => `<p style="margin-bottom: 15px; line-height: 1.6;">${p.trim()}</p>`)
			.join("\n")

		html += `
      <div style="font-size: 16px;">
        ${paragraphs}
      </div>
    `
	}

	html += "</article>"
	return html
}

/**
 * Generate complete digest email HTML
 */
function generateDigestHTML(
	bookmarks: Array<{
		title: string
		url: string
		summary?: string
		content?: {
			cleanedContent?: string
			markdown?: string
		} | null
	}>,
	digestTitle: string,
): string {
	const bookmarkCount = bookmarks.length
	const date = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	})

	let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${digestTitle}</title>
  <style>
    body {
      font-family: Georgia, serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 5px;
    }
    .header {
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${digestTitle}</h1>
    <p class="meta">${date} • ${bookmarkCount} ${bookmarkCount === 1 ? "article" : "articles"}</p>
  </div>

  ${bookmarks.map((bookmark) => formatBookmarkForKindle(bookmark)).join("\n")}

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 12px;">
    <p>This digest was sent from Recall Stack. Visit your <a href="https://www.amazon.com/gp/digital/fiona/manage">Kindle Library</a> to read.</p>
  </footer>
</body>
</html>
  `

	return html
}

/**
 * Send digest email via Resend
 * This is an action because it makes external API calls
 */
export const sendDigestEmail = action({
	args: {
		bookmarkIds: v.array(v.id("bookmarks")),
		digestTitle: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		// Get user
		const user = await ctx.runQuery(internal.users.me)
		if (!user) {
			throw new Error("User not found")
		}

		// Get user settings
		const settings = await ctx.runQuery(internal.userSettings.getUserSettings)
		if (!settings || !settings.kindleEmail) {
			throw new Error("Kindle email not configured")
		}

		if (!settings.isKindleEnabled) {
			throw new Error("Kindle integration is disabled")
		}

		// Get bookmarks data
		const bookmarks = await ctx.runQuery(internal.kindle.getBookmarksForDigest, {
			bookmarkIds: args.bookmarkIds,
			userId: user._id,
		})

		if (bookmarks.length === 0) {
			throw new Error("No valid bookmarks found")
		}

		// Check for Resend API key
		const resendApiKey = process.env.RESEND_API_KEY
		if (!resendApiKey) {
			throw new Error(
				"RESEND_API_KEY not configured. Please add it to your Convex environment variables.",
			)
		}

		// Initialize Resend
		const resend = new Resend(resendApiKey)

		// Generate digest title
		const digestTitle =
			args.digestTitle ||
			`Recall Stack Digest - ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`

		// Generate email HTML
		const emailHTML = generateDigestHTML(bookmarks as any, digestTitle)

		try {
			// Send email via Resend
			const result = await resend.emails.send({
				from: "Recall Stack <noreply@recallstack.app>", // Replace with your verified domain
				to: settings.kindleEmail,
				subject: digestTitle,
				html: emailHTML,
			})

			// Update last digest sent timestamp
			await ctx.runMutation(internal.userSettings.updateLastDigestSent)

			return {
				success: true,
				emailId: result.data?.id,
				bookmarkCount: bookmarks.length,
			}
		} catch (error) {
			console.error("Failed to send digest email:", error)
			throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`)
		}
	},
})

/**
 * Send digest for all unread bookmarks (for scheduled digests)
 */
export const sendScheduledDigest = action({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			throw new Error("Not authenticated")
		}

		// Get user
		const user = await ctx.runQuery(internal.users.me)
		if (!user) {
			throw new Error("User not found")
		}

		// Get user settings
		const settings = await ctx.runQuery(internal.userSettings.getUserSettings)
		if (
			!settings ||
			!settings.kindleEmail ||
			!settings.isKindleEnabled ||
			settings.digestFrequency === "manual"
		) {
			throw new Error(
				"Scheduled digests not configured or enabled",
			)
		}

		// Get bookmarks since last digest
		const bookmarks = await ctx.runQuery(internal.bookmarks.getBookmarks, {
			folderId: undefined,
			tagId: undefined,
		})

		// Filter bookmarks created since last digest
		const lastDigestTime = settings.lastDigestSent || 0
		const newBookmarks = bookmarks.filter(
			(b: { createdAt: number }) => b.createdAt > lastDigestTime,
		)

		if (newBookmarks.length === 0) {
			return {
				success: true,
				message: "No new bookmarks to send",
				bookmarkCount: 0,
			}
		}

		// Get bookmark IDs
		const bookmarkIds = newBookmarks.map(
			(b: { _id: Id<"bookmarks"> }) => b._id,
		)

		// Send digest
		return await ctx.runAction(internal.kindle.sendDigestEmail, {
			bookmarkIds,
			digestTitle: `Your ${settings.digestFrequency} Recall Stack Digest`,
		})
	},
})
