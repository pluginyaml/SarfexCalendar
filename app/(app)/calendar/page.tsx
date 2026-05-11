import { CalendarManager } from "@/components/calendar/calendar-manager";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

export const metadata = {
  title: "Kalender",
};

export default function CalendarPage() {
  return <CalendarManager timezone={DEFAULT_TIMEZONE} />;
}
