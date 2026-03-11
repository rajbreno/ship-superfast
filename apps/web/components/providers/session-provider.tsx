"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
  useMemo,
  useCallback,
} from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../../packages/convex/convex/_generated/api";
import type { Doc } from "../../../../packages/convex/convex/_generated/dataModel";

type SessionContextType = {
  currentUser: Doc<"users"> | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const { signOut: convexSignOut } = useAuthActions();

  const userData = useQuery(api.users.getCurrentWithRole);

  const isLoading = userData === undefined;
  const currentUser = userData?.user ?? null;
  const isSignedIn = !!currentUser;
  const isAdmin = userData?.isAdmin ?? false;

  const signOut = useCallback(async () => {
    await convexSignOut();
  }, [convexSignOut]);

  const value = useMemo(
    () => ({
      currentUser,
      isLoading,
      isSignedIn,
      isAdmin,
      signOut,
    }),
    [currentUser, isLoading, isSignedIn, isAdmin, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
