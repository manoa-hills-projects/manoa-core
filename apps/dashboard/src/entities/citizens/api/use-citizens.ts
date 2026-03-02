import { useMutation, useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { type ApiResponse, api } from "@/shared/api/api-client";
import type { Citizen } from "../model/types";

export const useCitizens = (
	pagination: PaginationState,
	filters?: { search?: string },
) => {
	return useQuery({
		queryKey: ["citizens", pagination, filters],
		queryFn: async () => {
			const response = await api
				.get("citizens", {
					searchParams: {
						page: pagination.pageIndex,
						limit: pagination.pageSize,
						search: filters?.search,
					},
				})
				.json<ApiResponse<Citizen>>();

			return response;
		},
		placeholderData: (previousData) => previousData,
	});
};

export const useCreateCitizen = () => {
	return useMutation({
		mutationFn: async (newCitizen: Partial<Citizen>) => {
			return await api
				.post("citizens", { json: newCitizen })
				.json<{ data: Citizen }>();
		},
	});
};

export const useUpdateCitizen = () => {
	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: Partial<Citizen>;
		}) => {
			return await api
				.patch(`citizens/${id}`, { json: data })
				.json<{ data: Citizen }>();
		},
	});
};
