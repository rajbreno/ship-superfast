import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired team invites daily at 03:00 UTC
crons.cron(
  "cleanup-expired-invites",
  "0 3 * * *",
  internal.inviteCleanup.cleanupExpiredInvites,
);

export default crons;
