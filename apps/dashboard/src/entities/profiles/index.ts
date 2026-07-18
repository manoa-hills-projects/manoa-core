/**
 * Entidad Profiles - Exportaciones públicas
 */

// Tipos
export type {
  Profile,
  ProfilePermission,
  ProfileWithPermissions,
  ProfileListItem,
  CreateProfileDto,
  UpdateProfileDto,
  PermissionItem,
  UpdatePermissionsDto,
  UserProfile,
  UserPermissionContext,
} from "./model/types";

// Queries
export {
  profileKeys,
  fetchProfilesOptions,
  useProfiles,
  useProfile,
  useProfilePermissions,
  useUserProfile,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  useUpdatePermissions,
  useAssignProfile,
} from "./model/queries";

// Constantes
export {
  MODULES,
  ACTIONS,
  SYSTEM_PROFILES,
  isSystemProfile,
} from "./model/constants";

export type { Module, Action } from "./model/constants";
