import { Header } from "@/components/layout/header";
import { CalendarManager } from "@/components/calendar/calendar-manager";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

export const metadata = {
  title: "Kalender",
};

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <Header
        eyebrow="Kalender"
        title="Tages-, Wochen- und Monatsansicht"
        description="Die Ansichten lesen Termine direkt aus Nextcloud und bleiben auf Europe/Berlin sowie Wochenstart Montag ausgerichtet."
      />
      <CalendarManager timezone={DEFAULT_TIMEZONE} />
    </div>
  );
}
