import type { LucideIcon } from 'lucide-react';

export type AppModule = 'HOUSES' | 'FAMILIES' | 'INHABITANTS' | 'DASHBOARD' | 'USERS' | 'SETTINGS';

export type AppAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'MANAGE';

export type AppPermission = `${AppModule}:${AppAction}`;

export interface NavigationItems {
  title: string;
  url: string; 
  icon: LucideIcon; 
  permission?: AppPermission;
  items?: NavigationSubItems[];
  isActive?: boolean;
}

export interface NavigationSubItems {
  title: string;
  url: string;
  permission?: AppPermission;
}