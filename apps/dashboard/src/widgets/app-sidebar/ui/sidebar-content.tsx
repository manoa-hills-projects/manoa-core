import { Link } from "@tanstack/react-router";
import type { NavigationItems } from "@/entities/navigation/model/types";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/shared/ui/sidebar";

interface SidebarGroupSectionProps {
	groupLabel: string;
	items: NavigationItems[];
}

export function SidebarGroupSection(props: SidebarGroupSectionProps) {
	const { groupLabel, items } = props;

	if (items.length === 0) return null;

	return (
		<div className="px-3 py-2">
			<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
				{groupLabel}
			</span>
			<SidebarMenu className="mt-1 space-y-0.5">
				{items.map((item) => (
					<SidebarMenuItem key={item.title}>
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
				))}
			</SidebarMenu>
		</div>
	);
}
