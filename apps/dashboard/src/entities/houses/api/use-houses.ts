import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";

import { type ApiResponse, api } from "@/shared/api/api-client";
import type { House } from "../model/types";

export const fetchHousesOptions = async ({
	search,
	limit,
}: { search: string; limit: number }) => {
	const response = await api
		.get("houses", {
			searchParams: {
				page: 1,
				limit,
				search,
			},
		})
		.json<ApiResponse<House>>();

	return response.data;
};

export const useHouses = (
	pagination: PaginationState,
	filters?: { search?: string },
) => {
	return useQuery({
		queryKey: ["houses", pagination, filters],
		queryFn: async () => {
			const response = await api
				.get("houses", {
					searchParams: {
						page: pagination.pageIndex + 1,
						limit: pagination.pageSize,
						search: filters?.search,
					},
				})
				.json<ApiResponse<House>>();

			return response;
		},
		placeholderData: (previousData) => previousData,
	});
};

export const useCreateHouse = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newHouse: Partial<House>) => {
			return await api
				.post("houses", { json: newHouse })
				.json<{ data: House }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["houses"] });
		},
	});
};

export const useUpdateHouse = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<House> }) => {
			return await api
				.patch(`houses/${id}`, { json: data })
				.json<{ data: House }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["houses"] });
		},
	});
};
