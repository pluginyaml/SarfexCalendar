import { Header } from "@/components/layout/header";
import { EventEditor } from "@/components/events/event-editor";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

export const metadata = {
  title: "Neuer Termin",
};

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Neuer Termin"
        title="Neuen Termin anlegen"
        description="Direkt in Nextcloud speichern."
      />
      <EventEditor mode="create" timezone={DEFAULT_TIMEZONE} />
    </div>
  );
}
