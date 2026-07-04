import type { LucideIcon } from "lucide-react";

export interface NavigationItems {
	title: string;
	url: string;
	icon: LucideIcon;
	/** Módulo requerido para ver este item (sin prop = visible para todos) */
	permission?: string;
	items?: NavigationSubItems[];
	isActive?: boolean;
}

export interface NavigationSubItems {
	title: string;
	url: string;
	permission?: string;
}
