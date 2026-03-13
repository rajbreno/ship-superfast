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

const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 32_000;

function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  if (process.env.WEB_ORIGIN) origins.push(process.env.WEB_ORIGIN);
  origins.push("http://localhost:3000", "http://localhost:3001");
  return origins;
}

function isAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin) ? origin : null;
}

function setCorsHeaders(response: Response, origin: string | null): Response {
  const allowedOrigin = isAllowedOrigin(origin);
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

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

  // Validate message array
  const messages = body.messages ?? [];
  if (messages.length > MAX_MESSAGES) {
    return new Response("Too many messages", { status: 400 });
  }
  for (const msg of messages) {
    if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_LENGTH) {
      return new Response("Message content too large", { status: 400 });
    }
  }

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
        messages,
      });

      for await (const chunk of result.textStream) {
        if (chunk) await append(chunk);
      }
    },
  );

  return setCorsHeaders(response, request.headers.get("Origin"));
});

// CORS preflight handler for /chat-stream
export const chatStreamOptions = httpAction(async (_, request) => {
  const origin = request.headers.get("Origin");
  const allowedOrigin = isAllowedOrigin(origin);
  if (
    origin !== null &&
    allowedOrigin &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: new Headers({
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }),
    });
  }
  return new Response(null, { status: 403 });
});
