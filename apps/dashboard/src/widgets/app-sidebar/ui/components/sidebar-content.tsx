import { Link } from "@tanstack/react-router";
import type { NavigationItems } from "@/entities/navigation/model/types";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/shared/ui/sidebar";

interface SidebarItemsList {
	items: NavigationItems[];
}

export function SidebarItemsList(props: SidebarItemsList) {
	const { items } = props;

	return (
		<SidebarMenu className="space-y-1">
			{items.map((item) => {
				return (
					<SidebarMenuItem className="px-4" key={item.title}>
						<SidebarMenuButton className="py-5" asChild tooltip={item.title}>
							<Link
								to={item.url}
								activeProps={{
									className:
										"bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
								}}
							>
								<item.icon />
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
