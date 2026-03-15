import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { type ApiResponse, api } from "@/shared/api/api-client";
import type { Law } from "../model/types";

export const useLaws = (
	pagination: PaginationState,
	filters?: { search?: string },
) => {
	return useQuery({
		queryKey: ["laws", pagination, filters],
		queryFn: async () => {
			const response = await api
				.get("laws", {
					searchParams: {
						page: pagination.pageIndex + 1,
						limit: pagination.pageSize,
						search: filters?.search,
					},
				})
				.json<ApiResponse<Law>>();
			return response;
		},
		placeholderData: (previousData) => previousData,
	});
};

export const useLaw = (id: string) => {
	return useQuery({
		queryKey: ["laws", id],
		queryFn: async () => {
			const response = await api.get(`laws/${id}`).json<{ data: Law }>();
			return response.data;
		},
		enabled: !!id,
	});
};

export const useScrapeLaws = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			return await api.post("laws/scrape").json<{
				message: string;
				scraped: number;
				errors: string[];
			}>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["laws"] });
		},
	});
};
