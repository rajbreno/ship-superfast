import { v } from "convex/values";
import { query } from "./_generated/server";
import { components } from "./_generated/api";
import { R2 } from "@convex-dev/r2";
import { getAuthUserId } from "@convex-dev/auth/server";

const r2 = new R2(components.r2);

/**
 * Client upload API — exports generateUploadUrl + syncMetadata for
 * use with the useUploadFile hook from @convex-dev/r2/react.
 */
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
  },
});

/**
 * Get a signed URL for accessing a stored file.
 * Default expiration: 7 days.
 */
export const getFileUrl = query({
  args: {
    key: v.string(),
    expiresIn: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const expiresIn = args.expiresIn ?? 60 * 60 * 24 * 7; // 7 days
    return await r2.getUrl(args.key, { expiresIn });
  },
});
