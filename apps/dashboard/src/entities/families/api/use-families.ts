import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";

import { type ApiResponse, api } from "@/shared/api/api-client";
import type { Family } from "../model/types";

export const fetchFamiliesOptions = async ({
	search,
	limit,
}: { search: string; limit: number }) => {
	const response = await api
		.get("families", {
			searchParams: {
				page: 1,
				limit,
				search,
			},
		})
		.json<ApiResponse<Family>>();

	return response.data;
};

export const fetchFamiliesList = fetchFamiliesOptions;

export const useFamilies = (
	pagination: PaginationState,
	filters?: { search?: string },
) => {
	return useQuery({
		queryKey: ["families", pagination, filters],
		queryFn: async () => {
			const response = await api
				.get("families", {
					searchParams: {
						page: pagination.pageIndex + 1,
						limit: pagination.pageSize,
						search: filters?.search,
					},
				})
				.json<ApiResponse<Family>>();

			return response;
		},
		placeholderData: (previousData) => previousData,
	});
};

export const useCreateFamily = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newFamily: Partial<Family>) => {
			return await api
				.post("families", { json: newFamily })
				.json<{ data: Family }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
};

export const useUpdateFamily = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<Family> }) => {
			return await api
				.patch(`families/${id}`, { json: data })
				.json<{ data: Family }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["families"] });
		},
	});
};
