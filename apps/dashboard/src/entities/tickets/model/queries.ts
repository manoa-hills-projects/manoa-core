import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type { Ticket } from "./types";

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters?: Record<string, string>) => [...ticketKeys.lists(), filters] as const,
  detail: (id: string) => [...ticketKeys.all, "detail", id] as const,
};

export const useTickets = (status?: string) =>
  useQuery({
    queryKey: ticketKeys.list({ status: status || "" }),
    queryFn: () => {
      const params = status ? `?status=${status}` : "";
      return api.get(`tickets${params}`).json<{ data: Ticket[] }>();
    },
  });

export const useTicket = (id: string) =>
  useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => api.get(`tickets/${id}`).json<Ticket>(),
    enabled: !!id,
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; category?: string }) =>
      api.post("tickets", { json: data }).json<Ticket>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.lists() }),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ticket> }) =>
      api.patch(`tickets/${id}`, { json: data }).json<Ticket>(),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
    },
  });
};
