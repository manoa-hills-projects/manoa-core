import { useMutation, useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { type ApiResponse, api } from "@/shared/api/api-client";
import type { House } from "../model/types";

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
						page: pagination.pageIndex,
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
	return useMutation({
		mutationFn: async (newHouse: Partial<House>) => {
			return await api
				.post("houses", { json: newHouse })
				.json<{ data: House }>();
		},
	});
};
export const useUpdateHouse = () => {
	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<House> }) => {
			return await api
				.patch(`houses/${id}`, { json: data })
				.json<{ data: House }>();
		},
	});
};
