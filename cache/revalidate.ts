import { revalidateTag as nextRevalidateTag } from "next/cache";

/**
 * Next.js 16 canary type mismatch fix
 * Runtime supports 1 argument, types expect 2.
 */
export function revalidateTag(tag: string) {
  // @ts-expect-error - Next 16 type bug (runtime is correct)
  return nextRevalidateTag(tag);
}