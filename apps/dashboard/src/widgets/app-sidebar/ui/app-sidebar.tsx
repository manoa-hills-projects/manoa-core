import { Sidebar, SidebarContent } from "@/shared/ui/sidebar"
import { SidebarItemsList } from "./components/sidebar-content"
import { NAV_ITEMS } from "@/entities/navigation/config/menu"

export const AppSidebar = () => {
	return (
		<Sidebar collapsible="offcanvas">
			{/* <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader> */}
			<SidebarContent>
				<SidebarItemsList items={NAV_ITEMS} />
				{/* <NavSecondsary items={data.navSecondary} className="mt-auto" /> */}
			</SidebarContent>
			{/* <SidebarFooter> */}
			{/* <NavUser user={data.user} /> */}
			{/* </SidebarFooter> */}
		</Sidebar>
	)
}