import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import * as Teams from "./lib/teams";
import { DEFAULT_FROM_EMAIL } from "./lib/constants";
import { emailLayout } from "./email";

const roleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

const inviteRoleValidator = v.union(
  v.literal("admin"),
  v.literal("member"),
);

// ── Queries ──────────────────────────────────────────────────────────

const planValidator = v.union(v.literal("free"), v.literal("pro"), v.literal("max"));

const teamWithMembershipValidator = v.object({
  _id: v.id("teams"),
  name: v.string(),
  ownerId: v.id("users"),
  ownerImage: v.optional(v.string()),
  createdAt: v.number(),
  role: roleValidator,
  plan: planValidator,
});

export const getMyTeam = query({
  args: {},
  returns: v.union(teamWithMembershipValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const results = await Teams.getUserTeams(ctx, userId);
    const owned = results.find(
      (r) => r.team !== null && r.membership.role === "owner",
    );
    const first = owned ?? results.find((r) => r.team !== null);
    if (!first || !first.team) return null;

    const owner = await ctx.db.get(first.team.ownerId);
    return {
      _id: first.team._id,
      name: first.team.name,
      ownerId: first.team.ownerId,
      ownerImage: owner?.image,
      createdAt: first.team.createdAt,
      role: first.membership.role,
      plan: first.team!.plan ?? "free",
    };
  },
});

export const getMyTeams = query({
  args: {},
  returns: v.array(teamWithMembershipValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const results = await Teams.getUserTeams(ctx, userId);
    const filtered = results.filter((r) => r.team !== null);
    return await Promise.all(
      filtered.map(async (r) => {
        const owner = await ctx.db.get(r.team!.ownerId);
        return {
          _id: r.team!._id,
          name: r.team!.name,
          ownerId: r.team!.ownerId,
          ownerImage: owner?.image,
          createdAt: r.team!.createdAt,
          role: r.membership.role,
          plan: r.team!.plan ?? "free",
        };
      }),
    );
  },
});

export const getTeamById = query({
  args: { teamId: v.id("teams") },
  returns: v.union(teamWithMembershipValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const membership = await Teams.getTeamMembership(ctx, args.teamId, userId);
    if (!membership) return null;

    const owner = await ctx.db.get(team.ownerId);
    return {
      _id: team._id,
      name: team.name,
      ownerId: team.ownerId,
      ownerImage: owner?.image,
      createdAt: team.createdAt,
      role: membership.role,
      plan: team.plan ?? "free",
    };
  },
});

export const getTeamMembers = query({
  args: { teamId: v.id("teams") },
  returns: v.array(
    v.object({
      membershipId: v.id("teamMembers"),
      userId: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      role: roleValidator,
      joinedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    await Teams.requireTeamMembership(ctx, args.teamId, userId);

    const members = await Teams.getTeamMembers(ctx, args.teamId);
    return members
      .filter((m) => m.user !== null)
      .map((m) => ({
        membershipId: m.membership._id,
        userId: m.membership.userId,
        name: m.user!.name,
        email: m.user!.email,
        image: m.user!.image,
        role: m.membership.role,
        joinedAt: m.membership.joinedAt,
      }));
  },
});

export const getPendingInvites = query({
  args: { teamId: v.id("teams") },
  returns: v.array(
    v.object({
      _id: v.id("teamInvites"),
      email: v.string(),
      role: inviteRoleValidator,
      invitedByName: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    await Teams.requireTeamRole(ctx, args.teamId, userId, ["owner", "admin"]);

    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    const pending = invites.filter((i) => i.status === "pending");

    return await Promise.all(
      pending.map(async (invite) => {
        const inviter = await ctx.db.get(invite.invitedBy);
        return {
          _id: invite._id,
          email: invite.email,
          role: invite.role,
          invitedByName: inviter?.name,
          createdAt: invite.createdAt,
        };
      }),
    );
  },
});

export const getMyPendingInvites = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("teamInvites"),
      teamId: v.id("teams"),
      teamName: v.string(),
      role: inviteRoleValidator,
      invitedByName: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user?.email) return [];

    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_email", (q) => q.eq("email", user.email!.toLowerCase()))
      .collect();

    const pending = invites.filter((i) => i.status === "pending");

    return await Promise.all(
      pending.map(async (invite) => {
        const team = await ctx.db.get(invite.teamId);
        const inviter = await ctx.db.get(invite.invitedBy);
        return {
          _id: invite._id,
          teamId: invite.teamId,
          teamName: team?.name ?? "Unknown",
          role: invite.role,
          invitedByName: inviter?.name,
          createdAt: invite.createdAt,
        };
      }),
    );
  },
});

// ── Mutations ────────────────────────────────────────────────────────

export const ensureTeam = mutation({
  args: {},
  returns: v.id("teams"),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Return existing owned team if any
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const ownedMembership = existing.find((m) => m.role === "owner");
    if (ownedMembership) return ownedMembership.teamId;

    // Auto-create team using user's name
    const user = await ctx.db.get(userId);
    const teamName = user?.name ? `${user.name}'s Team` : "My Team";

    const now = Date.now();
    const teamId = await ctx.db.insert("teams", {
      name: teamName,
      ownerId: userId,
      plan: "free",
      createdAt: now,
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    return teamId;
  },
});

export const removeMember = mutation({
  args: { teamId: v.id("teams"), userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");

    const callerMembership = await Teams.requireTeamMembership(
      ctx,
      args.teamId,
      callerId,
    );
    const targetMembership = await Teams.requireTeamMembership(
      ctx,
      args.teamId,
      args.userId,
    );

    const isSelf = callerId === args.userId;

    if (isSelf) {
      if (callerMembership.role === "owner") {
        throw new Error("Owner cannot leave. Transfer ownership first.");
      }
    } else {
      if (!["owner", "admin"].includes(callerMembership.role)) {
        throw new Error("Only owners and admins can remove members");
      }
      if (targetMembership.role === "owner") {
        throw new Error("Cannot remove the team owner");
      }
      if (
        callerMembership.role === "admin" &&
        targetMembership.role === "admin"
      ) {
        throw new Error("Only the owner can remove admins");
      }
    }

    await ctx.db.delete(targetMembership._id);
    return null;
  },
});

export const changeMemberRole = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: inviteRoleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");

    await Teams.requireTeamRole(ctx, args.teamId, callerId, ["owner"]);

    if (callerId === args.userId) {
      throw new Error("Cannot change your own role");
    }

    const targetMembership = await Teams.requireTeamMembership(
      ctx,
      args.teamId,
      args.userId,
    );

    if (targetMembership.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }

    await ctx.db.patch(targetMembership._id, { role: args.role });
    return null;
  },
});

export const acceptInvite = mutation({
  args: { inviteId: v.id("teamInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("User email not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("Invite is no longer pending");
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error("This invite is for a different email");
    }

    const existing = await Teams.getTeamMembership(ctx, invite.teamId, userId);
    if (existing) {
      await ctx.db.patch(args.inviteId, { status: "accepted" });
      return null;
    }

    await ctx.db.insert("teamMembers", {
      teamId: invite.teamId,
      userId,
      role: invite.role,
      joinedAt: Date.now(),
    });

    await ctx.db.patch(args.inviteId, { status: "accepted" });
    return null;
  },
});

export const declineInvite = mutation({
  args: { inviteId: v.id("teamInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("User email not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error("Invite is no longer pending");
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error("This invite is for a different email");
    }

    await ctx.db.patch(args.inviteId, { status: "declined" });
    return null;
  },
});

export const cancelInvite = mutation({
  args: { inviteId: v.id("teamInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");

    await Teams.requireTeamRole(ctx, invite.teamId, userId, ["owner", "admin"]);

    if (invite.status !== "pending") throw new Error("Invite is no longer pending");
    await ctx.db.delete(args.inviteId);
    return null;
  },
});


export const transferOwnership = mutation({
  args: { teamId: v.id("teams"), newOwnerId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");

    await Teams.requireTeamRole(ctx, args.teamId, callerId, ["owner"]);

    if (callerId === args.newOwnerId) {
      throw new Error("You are already the owner");
    }

    const targetMembership = await Teams.requireTeamMembership(
      ctx,
      args.teamId,
      args.newOwnerId,
    );
    const callerMembership = await Teams.requireTeamMembership(
      ctx,
      args.teamId,
      callerId,
    );

    // Promote target to owner, demote caller to admin
    await ctx.db.patch(targetMembership._id, { role: "owner" });
    await ctx.db.patch(callerMembership._id, { role: "admin" });
    await ctx.db.patch(args.teamId, { ownerId: args.newOwnerId });
    return null;
  },
});

export const updateTeamName = mutation({
  args: { teamId: v.id("teams"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    await Teams.requireTeamRole(ctx, args.teamId, userId, ["owner", "admin"]);

    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Team name cannot be empty");
    if (trimmed.length > 50) throw new Error("Team name must be 50 characters or fewer");

    await ctx.db.patch(args.teamId, { name: trimmed });
    return null;
  },
});

// ── Internal functions ───────────────────────────────────────────────

/** Used by actions (e.g. createCheckout) to verify the caller's team role. */
export const getMyTeamRole = internalQuery({
  args: { teamId: v.id("teams") },
  returns: v.union(
    v.object({ role: roleValidator }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const membership = await Teams.getTeamMembership(ctx, args.teamId, userId);
    if (!membership) return null;

    return { role: membership.role };
  },
});

/** Atomic validate + create invite in a single transaction to prevent race conditions. */
export const validateAndCreateInvite = internalMutation({
  args: {
    teamId: v.id("teams"),
    callerId: v.id("users"),
    email: v.string(),
    role: inviteRoleValidator,
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    teamName: v.optional(v.string()),
    callerName: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return { success: false, error: "Team not found" };

    const membership = await Teams.getTeamMembership(
      ctx,
      args.teamId,
      args.callerId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return { success: false, error: "Not authorized to invite" };
    }

    // Prevent inviting yourself
    const caller = await ctx.db.get(args.callerId);
    if (caller?.email && caller.email.toLowerCase() === args.email.toLowerCase()) {
      return { success: false, error: "You cannot invite yourself" };
    }

    // Prevent inviting someone who is already a team member
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_userId", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const m of members) {
      const memberUser = await ctx.db.get(m.userId);
      if (memberUser?.email && memberUser.email.toLowerCase() === args.email.toLowerCase()) {
        return { success: false, error: "This person is already a team member" };
      }
    }

    const existingInvites = await ctx.db
      .query("teamInvites")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
    const duplicate = existingInvites.find(
      (i) =>
        i.email.toLowerCase() === args.email.toLowerCase() &&
        i.status === "pending",
    );
    if (duplicate) {
      return { success: false, error: "Invite already sent to this email" };
    }

    // Create invite in the same transaction — no race condition
    await ctx.db.insert("teamInvites", {
      teamId: args.teamId,
      email: args.email.toLowerCase(),
      role: args.role,
      invitedBy: args.callerId,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      success: true,
      teamName: team.name,
      callerName: caller?.name,
    };
  },
});

// ── Invite action (sends email) ──────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inviteEmailTemplate(
  teamName: string,
  inviterName: string,
  role: string,
  dashboardUrl: string,
) {
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);
  return emailLayout(
    `<p style="margin:0 0 16px;"><strong>${safeInviterName}</strong> invited you to join <strong>${safeTeamName}</strong> as ${role === "admin" ? "an admin" : "a member"}.</p>
<p style="margin:0 0 24px;"><a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:10px 24px;background:#18181b;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">View Invite</a></p>
<p style="margin:0;font-size:12px;color:#a1a1aa;">If you weren't expecting this, ignore this email.</p>`,
  );
}

export const inviteMember = action({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
    role: inviteRoleValidator,
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const currentUser = await ctx.runQuery(internal.users.currentInternal);
    if (!currentUser) throw new Error("Unauthorized");
    const userId = currentUser._id;

    const result = await ctx.runMutation(internal.teams.validateAndCreateInvite, {
      teamId: args.teamId,
      callerId: userId,
      email: args.email,
      role: args.role,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const validation = result;

    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const from = DEFAULT_FROM_EMAIL;

    try {
      await ctx.runMutation(internal.email.sendEmail, {
        from,
        to: args.email,
        subject: `You've been invited to join ${validation.teamName}`,
        html: inviteEmailTemplate(
          validation.teamName!,
          validation.callerName ?? "A team member",
          args.role,
          `${siteUrl}/dashboard/team`,
        ),
      });
    } catch (e) {
      console.warn("Invite created but email failed to send:", e);
      return {
        success: true,
        error: "Invite created but notification email could not be sent",
      };
    }

    return { success: true };
  },
});
