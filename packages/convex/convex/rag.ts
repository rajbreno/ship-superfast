import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

const embeddingModel = process.env.RAG_EMBEDDING_MODEL ?? "text-embedding-3-small";

export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding(embeddingModel),
  embeddingDimension: 1536,
});

const MAX_QUERY_LENGTH = 5_000;
const MAX_NAMESPACE_LENGTH = 64;
const ALLOWED_NAMESPACE_PATTERN = /^[a-zA-Z0-9_-]+$/;

function validateNamespace(namespace: string | undefined): string {
  const ns = namespace ?? "global";
  if (ns.length > MAX_NAMESPACE_LENGTH || !ALLOWED_NAMESPACE_PATTERN.test(ns)) {
    throw new Error("Invalid namespace");
  }
  return ns;
}

// Add a document to the knowledge base (internal-only to prevent data poisoning)
export const addDocument = internalAction({
  args: { text: v.string(), namespace: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await rag.add(ctx, {
      namespace: validateNamespace(args.namespace),
      text: args.text,
    });
    return null;
  },
});

// Search the knowledge base
export const search = action({
  args: { query: v.string(), namespace: v.optional(v.string()) },
  // Results are SearchResult[] from @convex-dev/rag — shape depends on component version
  returns: v.object({ results: v.any(), text: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (!args.query.trim() || args.query.length > MAX_QUERY_LENGTH) {
      throw new Error("Query must be between 1 and 5000 characters");
    }
    const { results, text } = await rag.search(ctx, {
      namespace: validateNamespace(args.namespace),
      query: args.query,
      limit: 10,
    });
    return { results, text };
  },
});

// Generate a response with RAG context
export const askQuestion = action({
  args: { prompt: v.string(), namespace: v.optional(v.string()) },
  // Context is RAG search context from @convex-dev/rag — complex nested type with generics
  returns: v.object({ answer: v.string(), context: v.any() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (!args.prompt.trim() || args.prompt.length > MAX_QUERY_LENGTH) {
      throw new Error("Prompt must be between 1 and 5000 characters");
    }
    const { text, context } = await rag.generateText(ctx, {
      search: { namespace: validateNamespace(args.namespace), limit: 10 },
      prompt: args.prompt,
      model: openai.chat(process.env.AGENT_MODEL ?? "gpt-4o-mini"),
    });
    return { answer: text, context };
  },
});
