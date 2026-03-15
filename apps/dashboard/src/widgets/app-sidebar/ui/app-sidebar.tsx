import { Separator } from "@/shared/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/shared/ui/sidebar";
import { useSidebarNav } from "../model/use-sidebar";
import { SidebarItemsList } from "./sidebar-content";
import { SidebarUser } from "./sidebar-user";

export const AppSidebar = () => {
	const { user, navItems, secondaryItems, isLoading } = useSidebarNav();

	return (
		<Sidebar collapsible="offcanvas">
			<SidebarHeader>
				{user ? (
					<SidebarUser
						user={{
							name: user.name,
							email: user.email,
							avatar: "",
						}}
					/>
				) : (
					<div className="p-4 text-sm text-muted-foreground animate-pulse">
						{isLoading ? "Cargando sesión..." : "Invitado"}
					</div>
				)}
				<Separator />
			</SidebarHeader>

			<SidebarContent>
				<SidebarItemsList items={navItems} />
			</SidebarContent>

			<SidebarFooter>
				{secondaryItems.length > 0 && (
					<>
						<SidebarItemsList items={secondaryItems} />
						<Separator />
					</>
				)}
			</SidebarFooter>
		</Sidebar>
	);
};
