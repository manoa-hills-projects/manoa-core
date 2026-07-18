import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type { Act } from "./types";

export const actKeys = {
  all: ["acts"] as const,
  lists: () => [...actKeys.all, "list"] as const,
  list: (filters?: Record<string, string>) => [...actKeys.lists(), filters] as const,
  detail: (id: string) => [...actKeys.all, "detail", id] as const,
};

export const useActs = (bookType?: string) =>
  useQuery({
    queryKey: actKeys.list({ bookType: bookType || "" }),
    queryFn: () => {
      const params = bookType ? `?bookType=${bookType}` : "";
      return api.get(`acts${params}`).json<{ data: Act[] }>();
    },
  });

export const useAct = (id: string) =>
  useQuery({
    queryKey: actKeys.detail(id),
    queryFn: () => api.get(`acts/${id}`).json<Act>(),
    enabled: !!id,
  });

export const useCreateAct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Act>) => api.post("acts", { json: data }).json<Act>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: actKeys.lists() }),
  });
};

export const useUpdateAct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Act> }) =>
      api.patch(`acts/${id}`, { json: data }).json<Act>(),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: actKeys.lists() });
      qc.invalidateQueries({ queryKey: actKeys.detail(id) });
    },
  });
};

export const useDeleteAct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`acts/${id}`).json<{ success: boolean }>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: actKeys.lists() }),
  });
};
