import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  Globe2,
  GraduationCap,
  MapPin,
  Monitor,
  User,
} from "lucide-react";

export const categoryIconOptions = [
  { value: "Monitor", label: "Monitor", icon: Monitor },
  { value: "BookOpen", label: "BookOpen", icon: BookOpen },
  { value: "MapPin", label: "MapPin", icon: MapPin },
  { value: "AlertTriangle", label: "AlertTriangle", icon: AlertTriangle },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Briefcase", label: "Briefcase", icon: Briefcase },
  { value: "User", label: "User", icon: User },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Globe2", label: "Globe2", icon: Globe2 },
  { value: "GraduationCap", label: "GraduationCap", icon: GraduationCap },
] as const;

const categoryIconMap = Object.fromEntries(
  categoryIconOptions.map((option) => [option.value, option.icon]),
) as Record<string, LucideIcon>;

export function getCategoryIcon(iconName: string) {
  return categoryIconMap[iconName] ?? Calendar;
}
