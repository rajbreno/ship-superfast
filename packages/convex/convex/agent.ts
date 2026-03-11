import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { v } from "convex/values";

const agentModel = process.env.AGENT_MODEL ?? "gpt-4o-mini";

export const supportAgent = new Agent(components.agent, {
  name: "Support Agent",
  languageModel: openai.chat(agentModel),
  instructions: "You are a helpful assistant.",
});

// Create a new thread and generate a response
export const createThread = action({
  args: { prompt: v.string() },
  returns: v.object({ threadId: v.string(), text: v.string() }),
  handler: async (ctx, { prompt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const { threadId, thread } = await supportAgent.createThread(ctx, {
      userId: identity.subject,
    });
    const result = await thread.generateText(
      { prompt } as Parameters<typeof thread.generateText>[0],
    );
    return { threadId, text: result.text };
  },
});

// Continue an existing thread (scoped to the authenticated user's threads)
export const continueThread = action({
  args: { prompt: v.string(), threadId: v.string() },
  returns: v.string(),
  handler: async (ctx, { prompt, threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const { thread } = await supportAgent.continueThread(ctx, {
      threadId,
      userId: identity.subject,
    });
    const result = await thread.generateText(
      { prompt } as Parameters<typeof thread.generateText>[0],
    );
    return result.text;
  },
});
