import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Agent } from "@convex-dev/agent";
import { google } from "@ai-sdk/google"; // Changed from openai to google
import { api } from "./_generated/api"; // Removed 'internal' as it's not used
import { z } from "zod";

// Initialize a basic agent for summarization and tagging.
// This agent won't have specific instructions or tools beyond generation.
// Ensure GOOGLE_GENERATIVE_AI_API_KEY (or the specific key for your provider) is set in your Convex project environment variables.
const contentAgent = new Agent(api.agent.client, {
  chat: google.chat("models/gemini-1.5-flash-latest"), // Changed to Gemini Flash
  // textEmbedding is not strictly needed for summarize/generateObject if not using RAG features here.
});

export const generateSummaryAndTags = internalAction({
  args: {
    content: v.string(),
  },
  handler: async (ctx, { content }) => {
    // Check for Google API key. User should verify the exact environment variable name.
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set. Skipping AI generation. Please set this for Gemini models.");
      return { summary: null, tags: null, error: "Required Google API Key (e.g., GOOGLE_GENERATIVE_AI_API_KEY) is not set." };
    }

    let summary: string | null = null;
    let tags: string[] | null = null;
    let error: string | null = null;

    try {
      // Check if content is substantial enough
      if (!content || content.trim().length < 50) { // Arbitrary minimum length
        console.log("Content too short for AI processing, skipping.");
        return { summary: "Content too short.", tags: [] };
      }

      // 1. Generate Summary
      try {
        const summaryResult = await contentAgent.generateText(ctx, {}, {
          prompt: `Please provide a concise summary (2-3 sentences) of the following text content. Focus on the main topics and key takeaways. If the content is too short, nonsensical, or primarily code/data, indicate that a summary cannot be generated. Content:\n\n${content.substring(0, 15000)}`, // Limit input length
        });
        summary = summaryResult.text;
      } catch (e: any) {
        console.error("Error generating summary:", e);
        error = `Error generating summary: ${e.message}`;
        // Continue to tag generation even if summary fails
      }

      // 2. Generate Tags
      try {
        const tagsResult = await contentAgent.generateObject(ctx, {}, {
          prompt: `Based on the following text content, suggest 3 to 5 relevant tags. Tags should be single words or short phrases. If the content is too short, nonsensical, or primarily code/data, return an empty list of tags. Content:\n\n${content.substring(0, 15000)}`, // Limit input length
          schema: z.object({
            tags: z.array(z.string()).describe("An array of 3 to 5 relevant tags."),
          }),
        });
        tags = tagsResult.object.tags;
      } catch (e: any) {
        console.error("Error generating tags:", e);
        if (error) error += `; Error generating tags: ${e.message}`;
        else error = `Error generating tags: ${e.message}`;
      }

      // 3. Update bookmarkContent with summary and tags (even if one failed)
      // This is now handled in the workflow, which will call this action
      // and then use its output to update the bookmarkContent.
      // So this action just returns the results.

      console.log("AI Processing Results:", { summary, tags });
      return { summary, tags, error };

    } catch (e: any) {
      console.error("Unhandled error in AI processing action:", e);
      return { summary: null, tags: null, error: `Unhandled error: ${e.message}` };
    }
  },
});
