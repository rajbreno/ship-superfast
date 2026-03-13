import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// @ts-ignore - authTables type incompatibility is a known Convex Auth limitation
export default defineSchema({
  ...authTables,
  users: defineTable({
    // Convex Auth default fields
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  }).index("email", ["email"]),

  registeredDevices: defineTable({
    deviceId: v.string(),
    userId: v.optional(v.id("users")),
    registeredAt: v.number(),
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_userId", ["userId"]),

  // Dodo Payments tables
  customers: defineTable({
    authId: v.optional(v.string()),
    dodoCustomerId: v.string(),
    email: v.string(),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"])
    .index("by_dodoCustomerId", ["dodoCustomerId"]),

  payments: defineTable({
    paymentId: v.string(),
    businessId: v.string(),
    customerEmail: v.string(),
    productName: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    webhookPayload: v.string(),
    createdAt: v.number(),
    teamId: v.optional(v.id("teams")),
  })
    .index("by_paymentId", ["paymentId"])
    .index("by_teamId", ["teamId"]),

  subscriptions: defineTable({
    subscriptionId: v.string(),
    businessId: v.string(),
    customerEmail: v.string(),
    planName: v.optional(v.string()),
    status: v.string(),
    webhookPayload: v.string(),
    createdAt: v.number(),
    teamId: v.optional(v.id("teams")),
  })
    .index("by_subscriptionId", ["subscriptionId"])
    .index("by_teamId", ["teamId"]),

  // Team tables
  teams: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("max"))),
    createdAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
    ),
    joinedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_teamId_and_userId", ["teamId", "userId"]),

  teamInvites: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    invitedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
    ),
    createdAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_email", ["email"]),
});
