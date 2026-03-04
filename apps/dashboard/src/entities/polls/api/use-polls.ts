import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/shared/api/api-client";
import type {
	CreatePollPayload,
	Poll,
	PollQueryParams,
	UpdatePollStatusPayload,
	VotePollPayload,
} from "../model/types";

export const usePolls = (params?: PollQueryParams) => {
	return useQuery({
		queryKey: ["polls", params],
		queryFn: async () => {
			const searchParams: Record<string, string | number> = {
				page: params?.page || 1,
				limit: params?.limit || 10,
			};

			if (params?.search) {
				searchParams.search = params.search;
			}

			const response = await api
				.get("polls", { searchParams })
				.json<ApiResponse<Poll>>();

			return response;
		},
	});
};

export const usePoll = (id: string) => {
	return useQuery({
		queryKey: ["polls", id],
		queryFn: async () => {
			const response = await api.get(`polls/${id}`).json<{ data: Poll }>();
			return response.data;
		},
		enabled: !!id,
	});
};

export const useCreatePoll = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreatePollPayload) => {
			return await api.post("polls", { json: data }).json<{ data: Poll }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["polls"] });
		},
	});
};

export const useUpdatePollStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: UpdatePollStatusPayload;
		}) => {
			return await api
				.patch(`polls/${id}/status`, { json: data })
				.json<{ data: Poll }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["polls"] });
		},
	});
};

export const useDeletePoll = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return await api.delete(`polls/${id}`).json<{ message: string }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["polls"] });
		},
	});
};

export const useVotePoll = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: VotePollPayload }) => {
			return await api
				.post(`polls/${id}/vote`, { json: data })
				.json<{ message: string }>();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["polls"] });
		},
	});
};
