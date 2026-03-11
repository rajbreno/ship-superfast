import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

export async function getTeamById(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
): Promise<Doc<"teams"> | null> {
  return await ctx.db.get(teamId);
}

export async function getTeamMembership(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<Doc<"teamMembers"> | null> {
  return await ctx.db
    .query("teamMembers")
    .withIndex("by_teamId_and_userId", (q) =>
      q.eq("teamId", teamId).eq("userId", userId),
    )
    .unique();
}

export async function requireTeamMembership(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
): Promise<Doc<"teamMembers">> {
  const membership = await getTeamMembership(ctx, teamId, userId);
  if (!membership) {
    throw new Error("Not a member of this team");
  }
  return membership;
}

export async function requireTeamRole(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
  roles: Array<"owner" | "admin" | "member">,
): Promise<Doc<"teamMembers">> {
  const membership = await requireTeamMembership(ctx, teamId, userId);
  if (!roles.includes(membership.role)) {
    throw new Error(`Requires one of: ${roles.join(", ")}`);
  }
  return membership;
}

export async function getTeamMembers(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
): Promise<
  Array<{
    membership: Doc<"teamMembers">;
    user: Doc<"users"> | null;
  }>
> {
  const members = await ctx.db
    .query("teamMembers")
    .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", teamId))
    .collect();

  return await Promise.all(
    members.map(async (membership) => ({
      membership,
      user: await ctx.db.get(membership.userId),
    })),
  );
}

export async function getUserTeams(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<
  Array<{
    team: Doc<"teams"> | null;
    membership: Doc<"teamMembers">;
  }>
> {
  const memberships = await ctx.db
    .query("teamMembers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  return await Promise.all(
    memberships.map(async (membership) => ({
      team: await ctx.db.get(membership.teamId),
      membership,
    })),
  );
}

// Billing-related plan helpers (getTeamPlan, isTeamPro, teamHasPaidPlan)
// are in lib/billing.ts to keep teams decoupled from payments.
