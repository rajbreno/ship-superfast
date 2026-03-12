import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { PRODUCT_PLAN_MAP, KNOWN_PRODUCTS, type PaidPlanTier } from "./plans";

// Re-export for consumers that imported from here
export { PRODUCT_PLAN_MAP, KNOWN_PRODUCTS };

// ── Pure helpers (no DB) ──────────────────────────────────────────────

export function resolveProductName(
  storedName: string | undefined,
  amount: number,
  webhookPayload?: string,
): string {
  if (storedName) return storedName;
  if (KNOWN_PRODUCTS[amount]) return KNOWN_PRODUCTS[amount];
  if (webhookPayload) {
    const name = extractNameFromPayload(webhookPayload);
    if (name) return name;
  }
  return "Payment";
}

export function resolvePlanFromWebhookPayload(webhookPayload: string): string {
  try {
    const payload = JSON.parse(webhookPayload);
    const productId = payload.data?.product_id;
    if (productId && PRODUCT_PLAN_MAP[productId]) {
      return PRODUCT_PLAN_MAP[productId];
    }
    const items = payload.data?.product_cart ?? payload.data?.items;
    if (Array.isArray(items) && items.length > 0) {
      const firstId = items[0]?.product_id;
      if (firstId && PRODUCT_PLAN_MAP[firstId]) {
        return PRODUCT_PLAN_MAP[firstId];
      }
    }
  } catch {
    // Best-effort
  }
  return "pro";
}

export function resolveSubscriptionPlanName(webhookPayload: string): string {
  try {
    const payload = JSON.parse(webhookPayload);
    const productName = payload.data?.product_name;
    if (productName) return productName;
    const productId = payload.data?.product_id;
    if (productId && PRODUCT_PLAN_MAP[productId]) {
      return PRODUCT_PLAN_MAP[productId].charAt(0).toUpperCase() + PRODUCT_PLAN_MAP[productId].slice(1);
    }
  } catch {
    // Best-effort
  }
  return "Subscription";
}

function extractNameFromPayload(webhookPayload: string): string | undefined {
  try {
    const payload = JSON.parse(webhookPayload);
    // Payment payloads store product info in product_cart or items
    const items = payload.data?.product_cart ?? payload.data?.items;
    if (Array.isArray(items) && items.length > 0) {
      const names = items
        .map((item: Record<string, unknown>) => {
          const product = item.product as Record<string, unknown> | undefined;
          return product?.name ?? item.product_name ?? item.name;
        })
        .filter(Boolean);
      if (names.length > 0) return names.join(", ");
    }
    // Subscription-style payloads
    if (payload.data?.product_name) return payload.data.product_name;
  } catch {
    // Best-effort
  }
  return undefined;
}

export function resolvePlanFromProductId(
  productId: string | undefined,
): PaidPlanTier {
  if (productId && PRODUCT_PLAN_MAP[productId]) {
    return PRODUCT_PLAN_MAP[productId];
  }
  return "pro"; // safe default for existing subscriptions
}

// ── DB helpers (called from within mutations) ─────────────────────────

export async function upsertCustomer(
  ctx: MutationCtx,
  email: string,
  dodoCustomerId: string,
  authId?: string,
): Promise<Id<"customers">> {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await ctx.db
    .query("customers")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .first();

  if (existing) {
    const patch: Record<string, string> = {};
    if (existing.dodoCustomerId !== dodoCustomerId) {
      patch.dodoCustomerId = dodoCustomerId;
    }
    if (authId && existing.authId !== authId) {
      patch.authId = authId;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
    }
    return existing._id;
  }

  return await ctx.db.insert("customers", {
    email: normalizedEmail,
    dodoCustomerId,
    ...(authId ? { authId } : {}),
  });
}

export async function updateTeamPlan(
  ctx: MutationCtx,
  teamId: Id<"teams">,
  plan: "free" | "pro" | "max",
): Promise<void> {
  const team = await ctx.db.get(teamId);
  if (team) {
    await ctx.db.patch(teamId, { plan });
  } else {
    console.warn(`updateTeamPlan: no team found for teamId=${teamId}`);
  }
}

export async function supersedePriorSubscriptions(
  ctx: MutationCtx,
  teamId: Id<"teams">,
  currentSubscriptionId: string,
): Promise<void> {
  const teamSubs = await ctx.db
    .query("subscriptions")
    .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
    .collect();
  for (const sub of teamSubs) {
    if (
      sub.subscriptionId !== currentSubscriptionId &&
      ["active", "renewed", "on_hold"].includes(sub.status)
    ) {
      await ctx.db.patch(sub._id, { status: "superseded" });
    }
  }
}

// ── TeamId resolution fallback ────────────────────────────────────────

export async function resolveTeamIdFromEmail(
  ctx: MutationCtx,
  customerEmail: string,
): Promise<Id<"teams"> | undefined> {
  // Find the user by email
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", customerEmail))
    .first();
  if (!user) return undefined;

  // Find their team membership — prefer owner role, then any
  const memberships = await ctx.db
    .query("teamMembers")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .collect();
  if (memberships.length === 0) return undefined;

  const ownerMembership = memberships.find((m) => m.role === "owner");
  if (!ownerMembership && memberships.length > 1) {
    console.warn(
      `resolveTeamIdFromEmail: user ${customerEmail} has ${memberships.length} team memberships but no owner role — picking first team arbitrarily`,
    );
  }
  return (ownerMembership ?? memberships[0]).teamId;
}

// ── Query helpers ─────────────────────────────────────────────────────

export async function getTeamSubscription(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
): Promise<Doc<"subscriptions"> | null> {
  const subscriptions = await ctx.db
    .query("subscriptions")
    .withIndex("by_teamId", (q) => q.eq("teamId", teamId))
    .collect();

  const active = subscriptions.find((s) =>
    ["active", "renewed", "on_hold"].includes(s.status),
  );
  return active ?? subscriptions[0] ?? null;
}

// ── Team plan helpers ─────────────────────────────────────────────────

export async function getTeamPlan(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
): Promise<"free" | "pro" | "max"> {
  const team = await ctx.db.get(teamId);
  return team?.plan ?? "free";
}

export async function isTeamPro(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
): Promise<boolean> {
  return (await getTeamPlan(ctx, teamId)) === "pro";
}

export async function teamHasPaidPlan(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
): Promise<boolean> {
  const plan = await getTeamPlan(ctx, teamId);
  return plan === "pro" || plan === "max";
}
