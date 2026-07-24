import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type { CitizenStats, StatsOverview } from "./types";

export const statsKeys = {
  all: ["stats"] as const,
  overview: () => [...statsKeys.all, "overview"] as const,
  citizens: () => [...statsKeys.all, "citizens"] as const,
};

export const useStatsOverview = () =>
  useQuery({
    queryKey: statsKeys.overview(),
    queryFn: () => api.get("stats/overview").json<StatsOverview>(),
    staleTime: 60_000,
  });

export const useCitizenStats = () =>
  useQuery({
    queryKey: statsKeys.citizens(),
    queryFn: () => api.get("stats/citizens").json<CitizenStats>(),
    staleTime: 60_000,
  });
