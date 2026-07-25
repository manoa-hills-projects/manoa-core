import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { api } from "@/shared/api/api-client";
import type { UserQueryParams } from "../model/types";

export const userKeys = {
	all: ["users"] as const,
	lists: () => [...userKeys.all, "list"] as const,
	list: (
		pagination: { pageIndex: number; pageSize: number },
		filters?: UserQueryParams,
	) => [...userKeys.lists(), pagination, filters] as const,
};

export function useUsers(
	pagination: { pageIndex: number; pageSize: number },
	filters?: UserQueryParams,
) {
	return useQuery({
		queryKey: userKeys.list(pagination, filters),
		queryFn: async () => {
			const offset = pagination.pageIndex * pagination.pageSize;
			const limit = pagination.pageSize;

			const response = await authClient.admin.listUsers({
				query: {
					limit,
					offset,
					...(filters?.search && {
						searchValue: filters.search,
						searchField: "name",
					}),
				},
			});

			if (response.error) {
				throw new Error(response.error.message || "Failed to fetch users");
			}

			const users = response.data.users;

			// Fetch profiles for all users in batch
			const usersWithProfiles = await Promise.all(
				users.map(async (u) => {
					try {
						const profile = await api
							.get(`profiles/users/${u.id}/profile`)
							.json<{ userId: string; profile: { id: string; name: string; key: string } | null }>();
						return {
							...u,
							profile_name: profile.profile?.name ?? null,
							profile_key: profile.profile?.key ?? null,
						};
					} catch {
						return { ...u, profile_name: null, profile_key: null };
					}
				}),
			);

			return {
				data: usersWithProfiles,
				metadata: {
					total: response.data.total,
				},
			};
		},
	});
}

export function useCreateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			data: Parameters<typeof authClient.admin.createUser>[0],
		) => {
			const response = await authClient.admin.createUser(data);
			if (response.error) {
				throw new Error(response.error.message || "Failed to create user");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.lists() });
		},
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: Parameters<typeof authClient.admin.updateUser>[0]["data"];
		}) => {
			const response = await authClient.admin.updateUser({
				userId: id,
				data,
			});
			if (response.error) {
				throw new Error(response.error.message || "Failed to update user");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.lists() });
		},
	});
}

export function useDeleteUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const response = await authClient.admin.removeUser({
				userId: id,
			});
			if (response.error) {
				throw new Error(response.error.message || "Failed to delete user");
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: userKeys.lists() });
		},
	});
}

export function useResetUserPassword() {
	return useMutation({
		mutationFn: async ({
			id,
			newPassword,
		}: {
			id: string;
			newPassword: string;
		}) => {
			const response = await authClient.admin.setUserPassword({
				userId: id,
				newPassword,
			});
			if (response.error) {
				throw new Error(response.error.message || "Failed to reset password");
			}
			return response.data;
		},
	});
}
