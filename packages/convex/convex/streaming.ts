import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { StreamIdValidator, StreamId } from "@convex-dev/persistent-text-streaming";
import { components } from "./_generated/api";
import { mutation, query, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { auth } from "./auth";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming,
);

const streamModel = process.env.STREAM_MODEL ?? "gpt-4o-mini";

// Create a new stream (call this from your chat mutation)
export const createStream = mutation({
  args: {},
  returns: StreamIdValidator,
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await persistentTextStreaming.createStream(ctx);
  },
});

// Get stream body (subscribe to this from the frontend)
export const getStreamBody = query({
  args: { streamId: StreamIdValidator },
  returns: v.object({ text: v.string(), status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId,
    );
  },
});

// HTTP action for streaming AI chat responses
export const streamChat = httpAction(async (ctx, request) => {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    streamId: string;
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    system?: string;
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    async (_ctx, _request, _streamId, append) => {
      const result = streamText({
        model: openai(streamModel),
        system:
          body.system ??
          "You are a helpful assistant. Provide your response in markdown format.",
        messages: body.messages ?? [],
      });

      for await (const chunk of result.textStream) {
        if (chunk) await append(chunk);
      }
    },
  );

  const allowedOrigin = process.env.WEB_ORIGIN ?? "*";
  const requestOrigin = request.headers.get("Origin");
  response.headers.set(
    "Access-Control-Allow-Origin",
    requestOrigin ?? allowedOrigin,
  );
  response.headers.set("Vary", "Origin");
  return response;
});

// CORS preflight handler for /chat-stream
export const chatStreamOptions = httpAction(async (_, request) => {
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
        "Access-Control-Max-Age": "86400",
      }),
    });
  }
  return new Response();
});
