import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { dodoWebhookHandler } from "./lib/dodoWebhooks";
import { streamChat, chatStreamOptions } from "./streaming";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Dodo Payments webhook
http.route({
  path: "/dodopayments-webhook",
  method: "POST",
  handler: dodoWebhookHandler,
});

// Persistent text streaming (AI chat)
http.route({
  path: "/chat-stream",
  method: "POST",
  handler: streamChat,
});

http.route({
  path: "/chat-stream",
  method: "OPTIONS",
  handler: chatStreamOptions,
});

export default http;
