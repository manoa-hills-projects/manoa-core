import { IconDashboard, IconHome, IconUsers, IconSettings } from "@tabler/icons-react"
import type { NavigationItems } from "../model/types"

export const NAV_ITEMS: NavigationItems[] = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: IconDashboard,
    permission: "DASHBOARD:READ" 
  },
  { 
    title: "Casas", 
    url: "/houses", 
    icon: IconHome,
    permission: "HOUSES:READ"
  },
  { 
    title: "Familias", 
    url: "/families", 
    icon: IconUsers,
    permission: "FAMILIES:READ"
  },
  { 
    title: "Configuración", 
    url: "/settings", 
    icon: IconSettings,
    permission: "SETTINGS:MANAGE" 
  }
]