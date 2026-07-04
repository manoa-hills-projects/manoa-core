/**
 * Tipos para el sistema RBAC
 */

export interface Profile {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProfilePermission {
  id: string;
  module: string;
  action: string;
  allowed: boolean;
}

export interface ProfileWithPermissions extends Profile {
  permissions: ProfilePermission[];
  userCount: number;
}

export interface ProfileListItem extends Profile {
  userCount: number;
  permissionsCount: number;
}

export interface CreateProfileDto {
  key: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  isDefault?: boolean;
}

export interface UpdateProfileDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface PermissionItem {
  module: string;
  action: string;
  allowed: boolean;
}

export interface UpdatePermissionsDto {
  permissions: PermissionItem[];
}

export interface UserProfile {
  userId: string;
  profile: {
    id: string;
    key: string;
    name: string;
    description: string | null;
  } | null;
  permissions: PermissionItem[];
}

export interface UserPermissionContext {
  userId: string;
  profileKey: string;
  profileName: string;
  isSuperAdmin: boolean;
  permissions: Map<string, boolean>;
}
