import { useMemo } from "react";
import { NAV_ITEMS, NAV_SECONDARY } from "@/entities/navigation/config/menu";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/shared/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/shared/ui/sidebar";
import { SidebarItemsList } from "./components/sidebar-content";
import { SidebarUser } from "./components/sidebar-user";

export const AppSidebar = () => {
	const { data } = authClient.useSession();

	const filteredNavItems = useMemo(() => {
		if (!data?.user) return [];

		return NAV_ITEMS.filter((item) => {
			if (!item.permission) return true;

			return authClient.admin.checkRolePermission({
				role: (data.user.role as "user" | "admin" | "superadmin") || "user",
				permissions: item.permission,
			});
		});
	}, [data?.user]);

	const filteredSecondaryNavItems = useMemo(() => {
		if (!data?.user) return [];

		return NAV_SECONDARY.filter((item) => {
			if (!item.permission) return true;

			return authClient.admin.checkRolePermission({
				role: (data.user.role as "user" | "admin" | "superadmin") || "user",
				permissions: item.permission,
			});
		});
	}, [data?.user]);

	return (
		<Sidebar collapsible="offcanvas">
			<SidebarHeader>
				{data?.user ? (
					<SidebarUser
						user={{
							name: data.user.name,
							email: data.user.email,
							avatar: "",
						}}
					/>
				) : (
					<div className="p-2 text-sm text-muted-foreground">Cargando...</div>
				)}
				<Separator />
			</SidebarHeader>
			<SidebarContent>
				<SidebarItemsList items={filteredNavItems} />
			</SidebarContent>
			<SidebarFooter>
				{filteredSecondaryNavItems.length > 0 && (
					<SidebarItemsList items={filteredSecondaryNavItems} />
				)}
				<Separator />
			</SidebarFooter>
		</Sidebar>
	);
};
