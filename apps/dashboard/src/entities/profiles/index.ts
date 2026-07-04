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
  MODULE_LABELS,
  MODULE_GROUPS,
  ACTIONS,
  ACTION_LABELS,
  COMMON_ACTIONS,
  ALL_ACTIONS,
  SYSTEM_PROFILES,
  isSystemProfile,
} from "./model/constants";

export type { Module, Action } from "./model/constants";
