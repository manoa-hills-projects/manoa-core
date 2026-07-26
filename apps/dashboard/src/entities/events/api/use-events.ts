import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type { Event } from "../model/types";

export const eventKeys = {
	all: ["events"] as const,
	lists: () => [...eventKeys.all, "list"] as const,
	list: (filters?: Record<string, string>) => [...eventKeys.lists(), filters] as const,
	detail: (id: string) => [...eventKeys.all, "detail", id] as const,
};

/**
 * Silencia errores de requests a /api/events porque algunos navegadores
 * con adblockers bloquean la palabra "events" en las URLs.
 */
async function silentFetch<T>(url: string): Promise<T> {
	try {
		return await api.get(url).json<T>();
	} catch {
		return { data: [] } as T;
	}
}

export const useEvents = (status?: string) =>
	useQuery({
		queryKey: eventKeys.list({ status: status || "" }),
		queryFn: () => {
			const params = status ? `?status=${status}` : "";
			const url = `events${params}`;
			return silentFetch<{ data: Event[] }>(url);
		},
		retry: false,
	});

export const useUpcomingEvents = () =>
	useQuery({
		queryKey: [...eventKeys.all, "upcoming"],
		queryFn: () => silentFetch<{ data: Event[] }>("events/upcoming"),
		retry: false,
	});

export const useEvent = (id: string) =>
	useQuery({
		queryKey: eventKeys.detail(id),
		queryFn: () => api.get(`events/${id}`).json<Event>(),
		enabled: !!id,
	});

export const useCreateEvent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: Partial<Event>) => api.post("events", { json: data }).json<Event>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
	});
};

export const useUpdateEvent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
			api.patch(`events/${id}`, { json: data }).json<Event>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
	});
};

export const useDeleteEvent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => api.delete(`events/${id}`).json<{ message: string }>(),
		onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
	});
};
