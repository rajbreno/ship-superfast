"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type PropsWithChildren,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../packages/convex/convex/_generated/api";
import type { Id } from "../../../../packages/convex/convex/_generated/dataModel";

type Team = {
  _id: Id<"teams">;
  name: string;
  ownerId: Id<"users">;
  ownerImage?: string;
  createdAt: number;
  role: "owner" | "admin" | "member";
  plan: "free" | "pro" | "max";
};

type TeamContextType = {
  activeTeam: Team | null;
  teams: Team[];
  isLoading: boolean;
  switchTeam: (teamId: Id<"teams">) => void;
};

const TeamContext = createContext<TeamContextType | null>(null);

const STORAGE_KEY = "activeTeamId";

export function useTeam() {
  const value = useContext(TeamContext);
  if (!value) {
    throw new Error("useTeam must be wrapped in a <TeamProvider />");
  }
  return value;
}

export function TeamProvider({ children }: PropsWithChildren) {
  const teams = useQuery(api.teams.getMyTeams);
  // Raw preference — what the user chose or what was in localStorage
  const [preferredTeamId, setPreferredTeamId] = useState<Id<"teams"> | null>(
    () => {
      if (typeof window === "undefined") return null;
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (stored as Id<"teams">) : null;
    },
  );

  // Derive the actual active team ID: validate preference against loaded teams
  const activeTeamId = useMemo(() => {
    if (teams === undefined) return preferredTeamId;
    if (teams.length === 0) return null;
    if (preferredTeamId && teams.some((t) => t._id === preferredTeamId)) {
      return preferredTeamId;
    }
    const owned = teams.find((t) => t.role === "owner");
    return (owned ?? teams[0])._id;
  }, [teams, preferredTeamId]);

  // Persist resolved ID to localStorage when it changes
  useEffect(() => {
    if (activeTeamId) {
      localStorage.setItem(STORAGE_KEY, activeTeamId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeTeamId]);

  const switchTeam = useCallback((teamId: Id<"teams">) => {
    setPreferredTeamId(teamId);
    localStorage.setItem(STORAGE_KEY, teamId);
  }, []);

  const activeTeam = useMemo(() => {
    if (!teams || !activeTeamId) return null;
    return teams.find((t) => t._id === activeTeamId) ?? null;
  }, [teams, activeTeamId]);

  const isLoading = teams === undefined;

  const value = useMemo(
    () => ({
      activeTeam,
      teams: teams ?? [],
      isLoading,
      switchTeam,
    }),
    [activeTeam, teams, isLoading, switchTeam],
  );

  return (
    <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
  );
}
