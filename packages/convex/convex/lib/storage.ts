import { ActionCtx } from "../_generated/server";
import { components } from "../_generated/api";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

/**
 * Upload a file to R2 storage
 * @returns The R2 object key
 */
export async function uploadFile(
  ctx: ActionCtx,
  file: Blob,
  options: { key: string; type: string },
): Promise<string> {
  const key = await r2.store(ctx, file, {
    key: options.key,
    type: options.type,
  });
  return key;
}

/**
 * Get a signed URL for an R2 object (7-day expiration)
 */
export async function getSignedUrl(key: string, expiresInSeconds = 60 * 60 * 24 * 7): Promise<string> {
  return await r2.getUrl(key, { expiresIn: expiresInSeconds });
}

/**
 * Delete an object from R2 storage
 */
export async function deleteFile(ctx: ActionCtx, key: string): Promise<void> {
  await r2.deleteObject(ctx, key);
}

export { r2 };
