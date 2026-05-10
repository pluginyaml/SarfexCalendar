import {
  Calendar,
  CalendarClock,
  FolderKanban,
  LayoutDashboard,
  MapPinned,
  Settings,
  Tags,
} from "lucide-react";

export const appNavigation = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/calendar",
    label: "Kalender",
    icon: Calendar,
  },
  {
    href: "/events",
    label: "Termine",
    icon: CalendarClock,
  },
  {
    href: "/templates",
    label: "Vorlagen",
    icon: FolderKanban,
  },
  {
    href: "/locations",
    label: "Standorte",
    icon: MapPinned,
  },
  {
    href: "/categories",
    label: "Kategorien",
    icon: Tags,
  },
  {
    href: "/settings",
    label: "Einstellungen",
    icon: Settings,
  },
] as const;

export const mobileNavigation = appNavigation.slice(0, 5);
