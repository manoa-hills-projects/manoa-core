import {
  IconDashboard,
  IconHome,
  IconSettings,
  IconSparkles,
  IconSpeakerphone,
  IconUser,
  IconUsers,
  IconVideo,
} from "@tabler/icons-react";
import type { NavigationItems } from "../model/types";

export const NAV_ITEMS: NavigationItems[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconDashboard,
  },
  {
    title: "Asistente IA",
    url: "/ai-assistant",
    icon: IconSparkles,
  },
  {
    title: "Viviendas",
    url: "/houses",
    icon: IconHome,
    permission: { census: ["read"] },
  },
  {
    title: "Familias",
    url: "/families",
    icon: IconUsers,
    permission: { census: ["read"] },
  },
  {
    title: "Ciudadanos",
    url: "/citizens",
    icon: IconUser,
    permission: { census: ["read"] },
  },
  {
    title: "Proyectos",
    url: "/polls",
    icon: IconSpeakerphone,
    permission: { project: ["read"] },
  },
  {
    title: "Asambleas",
    url: "/meetings",
    icon: IconVideo,
    permission: { project: ["read"] },
  },
  {
    title: "Usuarios",
    url: "/users",
    icon: IconUsers,
    permission: { user: ["list"] },
  },
];

export const NAV_SECONDARY: NavigationItems[] = [
  {
    title: "Configuración",
    url: "/settings",
    icon: IconSettings,
    permission: { user: ["list"] },
  },
];
