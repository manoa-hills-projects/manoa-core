import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/shared/ui/sidebar"
import type { NavigationItems } from "@/entities/navigation/model/types";
import { Link } from "@tanstack/react-router"

interface SidebarItemsList {
  items: NavigationItems[]
}

export function SidebarItemsList(props: SidebarItemsList) {
  const { items } = props;

  return (
    <SidebarMenu>
      {items.map((item) => {
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link
                to={item.url}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
              >
                <item.icon className="size-5" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}