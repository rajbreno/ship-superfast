import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useQuery } from "convex/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../../../packages/convex/convex/_generated/api";
import type { Id } from "../../../../packages/convex/convex/_generated/dataModel";

const ACTIVE_TEAM_KEY = "activeTeamId";

type TeamInfo = {
  _id: Id<"teams">;
  name: string;
  role: string;
  plan: string;
};

type ActiveTeamContextValue = {
  activeTeam: TeamInfo | null;
  allTeams: TeamInfo[];
  switchTeam: (teamId: Id<"teams">) => void;
};

const ActiveTeamContext = createContext<ActiveTeamContextValue | null>(null);

export { ActiveTeamContext, ACTIVE_TEAM_KEY };
export type { TeamInfo };

export function useActiveTeamValue(): ActiveTeamContextValue {
  const allTeams = useQuery(api.teams.getMyTeams);
  const [activeTeamId, setActiveTeamId] = useState<Id<"teams"> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_TEAM_KEY).then((stored) => {
      if (stored) setActiveTeamId(stored as Id<"teams">);
    });
  }, []);

  const activeTeam = useMemo(() => {
    if (!allTeams || allTeams.length === 0) return null;
    if (activeTeamId) {
      const found = allTeams.find((t) => t._id === activeTeamId);
      if (found) return found;
    }
    const owned = allTeams.find((t) => t.role === "owner");
    return owned ?? allTeams[0];
  }, [allTeams, activeTeamId]);

  const switchTeam = useCallback((teamId: Id<"teams">) => {
    setActiveTeamId(teamId);
    AsyncStorage.setItem(ACTIVE_TEAM_KEY, teamId);
  }, []);

  return { activeTeam, allTeams: allTeams ?? [], switchTeam };
}

export function useActiveTeam(): ActiveTeamContextValue {
  const ctx = useContext(ActiveTeamContext);
  if (!ctx) {
    throw new Error("useActiveTeam must be used within ActiveTeamProvider");
  }
  return ctx;
}
