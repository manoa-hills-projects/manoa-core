import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type { Event } from "../model/types";

export const eventKeys = {
	all: ["events"] as const,
	lists: () => [...eventKeys.all, "list"] as const,
	list: (filters?: Record<string, string>) => [...eventKeys.lists(), filters] as const,
	detail: (id: string) => [...eventKeys.all, "detail", id] as const,
};

export const useEvents = (status?: string) =>
	useQuery({
		queryKey: eventKeys.list({ status: status || "" }),
		queryFn: () => {
			const params = status ? `?status=${status}` : "";
			return api.get(`meetings${params}`).json<{ data: Event[] }>();
		},
	});

export const useUpcomingEvents = () =>
	useQuery({
		queryKey: [...eventKeys.all, "upcoming"],
		queryFn: () => api.get("meetings/upcoming").json<{ data: Event[] }>(),
	});

export const useEvent = (id: string) =>
	useQuery({
		queryKey: eventKeys.detail(id),
		queryFn: () => api.get(`meetings/${id}`).json<Event>(),
		enabled: !!id,
	});

export const useCreateEvent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<Event>) => api.post("meetings", { json: data }).json<Event>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
	});
};

export const useUpdateEvent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
			api.patch(`meetings/${id}`, { json: data }).json<Event>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
	});
};

export const useDeleteEvent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => api.delete(`meetings/${id}`).json<{ message: string }>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
	});
};
