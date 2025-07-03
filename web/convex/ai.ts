import { google } from "@ai-sdk/google" // Changed from openai to google
import { Agent } from "@convex-dev/agent"
import { v } from "convex/values"
import { z } from "zod"
import { components } from "./_generated/api" // Removed 'internal' as it's not used
import { internalAction } from "./_generated/server"

// Initialize a basic agent for summarization and tagging.
// This agent won't have specific instructions or tools beyond generation.
// Ensure GOOGLE_GENERATIVE_AI_API_KEY (or the specific key for your provider) is set in your Convex project environment variables.
const contentAgent = new Agent(components.agent, {
	chat: google.chat("gemini-2.0-flash"), // Changed to Gemini Flash
	// textEmbedding is not strictly needed for summarize/generateObject if not using RAG features here.
})

export const generateSummaryAndTags = internalAction({
	args: {
		content: v.string(),
	},
	handler: async (ctx, { content }) => {
		// Check for Google API key. User should verify the exact environment variable name.
		if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
			console.error(
				"GOOGLE_GENERATIVE_AI_API_KEY is not set. Skipping AI generation. Please set this for Gemini models.",
			)
			return {
				summary: null,
				tags: null,
				error:
					"Required Google API Key (e.g., GOOGLE_GENERATIVE_AI_API_KEY) is not set.",
			}
		}

		let summary: string | null = null
		let tags: string[] = [] // Initialize as empty array
		let error: string | null = null

		try {
			// Check if content is substantial enough
			if (!content || content.trim().length < 50) {
				// Arbitrary minimum length
				console.log("Content too short for AI processing, skipping.")
				return { summary: "Content too short to process.", tags: [] }
			}

			const combinedSchema = z.object({
				summary: z
					.string()
					.describe(
						"A concise summary of the content (2-3 sentences). Focus on main topics and key takeaways. If summary cannot be generated (e.g. content too short/nonsensical), return a brief explanation like 'Content not suitable for summarization'.",
					),
				tags: z
					.array(z.string())
					.describe(
						"An array of 3 to 5 relevant tags (single words or short phrases). If no relevant tags can be generated, return an empty array.",
					),
			})

			const prompt = `Analyze the following text content and provide a concise summary and a list of relevant tags.
Format your response as a JSON object with a "summary" field (string) and a "tags" field (array of strings).

Content:
${content.substring(0, 15000)}

Please generate a summary (2-3 sentences) focusing on main topics and key takeaways.
Suggest 3 to 5 relevant tags (single words or short phrases).
If the content is too short, nonsensical, or primarily code/data:
- For summary: return a brief explanation like 'Content not suitable for summarization'.
- For tags: return an empty array.`

			try {
				const result = await contentAgent.generateObject(
					ctx,
					{},
					{
						prompt: prompt,
						schema: combinedSchema,
					},
				)
				summary = result.object.summary
				tags = result.object.tags

				// Handle cases where LLM might explicitly say it can't summarize/tag as per prompt instructions
				if (summary?.toLowerCase().includes("not suitable for summarization")) {
					console.log(
						`Content marked as not suitable for summary by LLM for content starting with: ${content.substring(0, 50)}...`,
					)
				}
				if (tags.length === 0) {
					console.log(
						`LLM returned no tags, potentially due to content suitability for content starting with: ${content.substring(0, 50)}...`,
					)
				}
			} catch (e) {
				console.error("Error generating summary and tags in a single call:", e)
				error = `Error in combined AI call: ${e}`
				// Set defaults in case of error
				summary = summary || "AI processing failed."
				tags = tags.length > 0 ? tags : []
			}

			console.log("AI Processing Results (Combined Call):", { summary, tags })
			return { summary, tags, error }
		} catch (e) {
			console.error("Unhandled error in AI processing action:", e)
			return {
				summary: "Unhandled AI error.",
				tags: [],
				error: `Unhandled error: ${e}`,
			}
		}
	},
})
