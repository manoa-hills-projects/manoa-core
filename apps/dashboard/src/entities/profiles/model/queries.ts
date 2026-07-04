/**
 * Queries para gestión de perfiles RBAC
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type {
  Profile,
  ProfileWithPermissions,
  CreateProfileDto,
  UpdateProfileDto,
  UpdatePermissionsDto,
  UserProfile,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════

export const profileKeys = {
  all: ["profiles"] as const,
  lists: () => [...profileKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...profileKeys.lists(), filters] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  permissions: (id: string) => [...profileKeys.all, "permissions", id] as const,
  user: (userId: string) => [...profileKeys.all, "user", userId] as const,
};

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtener lista de perfiles
 */
export const useProfiles = (filters?: {
  isActive?: boolean;
  isSystem?: boolean;
  isDefault?: boolean;
}) =>
  useQuery({
    queryKey: profileKeys.list(filters || {}),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters?.isActive !== undefined)
        searchParams.set("isActive", String(filters.isActive));
      if (filters?.isSystem !== undefined)
        searchParams.set("isSystem", String(filters.isSystem));
      if (filters?.isDefault !== undefined)
        searchParams.set("isDefault", String(filters.isDefault));

      const query = searchParams.toString();
      const url = query ? `profiles?${query}` : "profiles";
      return api.get(url).json<{ data: Profile[]; total: number }>();
    },
  });

/**
 * Obtener perfil por ID con permisos
 */
export const useProfile = (id: string) =>
  useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: () => api.get(`profiles/${id}`).json<ProfileWithPermissions>(),
    enabled: !!id,
  });

/**
 * Obtener permisos de un perfil
 */
export const useProfilePermissions = (id: string) =>
  useQuery({
    queryKey: profileKeys.permissions(id),
    queryFn: () =>
      api
        .get(`profiles/${id}/permissions`)
        .json<{
          profileId: string;
          profileName: string;
          permissions: { id: string; module: string; action: string; allowed: boolean }[];
        }>(),
    enabled: !!id,
  });

/**
 * Obtener perfil de un usuario
 */
export const useUserProfile = (userId: string) =>
  useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: () => api.get(`profiles/users/${userId}/profile`).json<UserProfile>(),
    enabled: !!userId,
  });

// ═══════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Crear nuevo perfil
 */
export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProfileDto) =>
      api.post("profiles", { json: data }).json<Profile>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
};

/**
 * Actualizar perfil
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileDto }) =>
      api.patch(`profiles/${id}`, { json: data }).json<Profile>(),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
};

/**
 * Eliminar perfil
 */
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`profiles/${id}`).json<{ deleted: boolean; message: string }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
};

/**
 * Actualizar permisos de un perfil
 */
export const useUpdatePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionsDto }) =>
      api
        .put(`profiles/${id}/permissions`, { json: data })
        .json<{ profileId: string; permissionsUpdated: number }>(),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.permissions(id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
    },
  });
};

/**
 * Asignar perfil a un usuario
 */
export const useAssignProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      profileId,
    }: {
      userId: string;
      profileId: string;
    }) =>
      api
        .put(`profiles/users/${userId}/profile`, { json: { profileId } })
        .json<{ userId: string; profileId: string; profileName: string }>(),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
    },
  });
};
