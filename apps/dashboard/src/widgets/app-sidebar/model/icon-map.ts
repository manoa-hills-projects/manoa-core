/**
 * Mapa de nombres de iconos (desde la DB) a componentes de lucide-react
 *
 * Los módulos en la DB almacenan el nombre del icono como string.
 * Este mapa los resuelve a componentes reales para renderizar en el sidebar.
 */

import {
	BarChart3,
	Calendar,
	CreditCard,
	File,
	FileSpreadsheet,
	FileText,
	Home,
	LayoutDashboard,
	Package,
	PenTool,
	Scale,
	Settings,
	Shield,
	ShieldCheck,
	Sparkles,
	User,
	UserCog,
	Users,
	Vote,
	Wallet,
	Wrench,
	type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
	dashboard: LayoutDashboard,
	Home,
	Users,
	User,
	FileText,
	File,
	PenTool,
	ShieldCheck,
	Vote,
	Calendar,
	Wallet,
	CreditCard,
	Wrench,
	Package,
	Scale,
	Sparkles,
	BarChart3,
	FileSpreadsheet,
	UserCog,
	Shield,
	Settings,
};
