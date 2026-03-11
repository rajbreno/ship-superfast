import { useRef } from "react";
import { usePaginatedQuery, PaginatedQueryReference } from "convex/react";

type UsePaginatedQueryOptions = {
  initialNumItems: number;
};

/**
 * Prevents scroll reset during pagination loading.
 *
 * The default usePaginatedQuery triggers re-renders when status changes
 * to 'LoadingMore', which can cause virtualized lists to reset scroll
 * position on Android.
 *
 * This wrapper caches results during 'LoadingMore' but keeps current
 * status so loading indicators still display.
 *
 * @see https://stack.convex.dev/help-my-app-is-overreacting
 */
export function useStablePaginatedQuery<
  Query extends PaginatedQueryReference,
>(
  query: Query,
  args: Parameters<typeof usePaginatedQuery<Query>>[1],
  options: UsePaginatedQueryOptions,
) {
  const result = usePaginatedQuery(query, args, options);
  const storedResults = useRef(result.results);

  if (result.status !== "LoadingMore") {
    storedResults.current = result.results;
  }

  return {
    ...result,
    results: storedResults.current,
  };
}
