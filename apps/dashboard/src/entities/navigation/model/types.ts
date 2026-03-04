import type { LucideIcon } from "lucide-react";

export type AppPermission = Record<string, string[]>;

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
