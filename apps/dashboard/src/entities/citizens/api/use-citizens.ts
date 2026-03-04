import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { type ApiResponse, api } from "@/shared/api/api-client";
import type { Citizen } from "../model/types";

export const fetchCitizensOptions = async ({
	search,
	limit,
}: {
	search: string;
	limit: number;
}) => {
	const response = await api
		.get("citizens", {
			searchParams: {
				page: 1,
				limit,
				search,
			},
		})
		.json<ApiResponse<Citizen>>();

	return response.data;
};

export const fetchCitizensList = fetchCitizensOptions;

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
						page: pagination.pageIndex + 1,
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
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newCitizen: Partial<Citizen>) => {
			return await api
				.post("citizens", { json: newCitizen })
				.json<{ data: Citizen }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["citizens"] });
		},
	});
};

export const useUpdateCitizen = () => {
	const queryClient = useQueryClient();

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
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["citizens"] });
		},
	});
};

export const useDeleteCitizen = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return await api.delete(`citizens/${id}`).json<{ message: string }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["citizens"] });
		},
	});
};
