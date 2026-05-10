import Link from "next/link";
import { EventsManager } from "@/components/events/events-manager";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

export const metadata = {
  title: "Termine",
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Termine"
        title="Chronologische Listenansicht"
        description="Die Liste zeigt standardmaessig die naechsten sechs Monate und laesst sich nach Text, Kategorie und Standort filtern."
        actions={
          <Button asChild>
            <Link href="/events/new">+ Termin</Link>
          </Button>
        }
      />
      <EventsManager timezone={DEFAULT_TIMEZONE} />
    </div>
  );
}
