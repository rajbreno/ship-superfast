import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired team invites daily at 03:00 UTC
crons.cron(
  "cleanup-expired-invites",
  "0 3 * * *",
  internal.inviteCleanup.cleanupExpiredInvites,
);

// Reset free plan credits monthly on the 1st at 00:00 UTC
crons.cron(
  "reset-free-plan-credits",
  "0 0 1 * *",
  internal.credits.resetFreePlanCredits,
);

export default crons;
