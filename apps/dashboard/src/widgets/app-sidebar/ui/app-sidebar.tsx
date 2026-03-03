import { NAV_ITEMS } from "@/entities/navigation/config/menu";
import { Link } from "@tanstack/react-router";
import { IconInnerShadowTop } from "@tabler/icons-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import { SidebarItemsList } from "./components/sidebar-content";

export const AppSidebar = () => {
	return (
		<Sidebar collapsible="offcanvas">
			<SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Manoa</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
			<SidebarContent>
				<SidebarItemsList items={NAV_ITEMS} />
				{/* <NavSecondsary items={data.navSecondary} className="mt-auto" /> */}
			</SidebarContent>
			{/* <SidebarFooter> */}
			{/* <NavUser user={data.user} /> */}
			{/* </SidebarFooter> */}
		</Sidebar>
	);
};
