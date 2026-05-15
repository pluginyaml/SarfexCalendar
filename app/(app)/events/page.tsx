import { EventsManager } from "@/components/events/events-manager";
import { Header } from "@/components/layout/header";
import { NewEventButton } from "@/components/layout/new-event-button";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

export const metadata = {
  title: "Termine",
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Termine"
        title="Chronologische Übersicht"
        description="Suche, Filter und Kalenderquellen für die nächsten Monate."
        actions={<NewEventButton />}
      />
      <EventsManager timezone={DEFAULT_TIMEZONE} />
    </div>
  );
}
