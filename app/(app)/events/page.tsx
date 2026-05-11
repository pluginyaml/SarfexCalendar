import Link from "next/link";
import { Plus } from "lucide-react";
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
        description="Die Liste zeigt standardmäßig die nächsten sechs Monate und lässt sich nach Text, Kategorie und Standort filtern."
        actions={
          <Button asChild className="gap-1.5">
            <Link href="/events/new">
              <Plus className="size-4" />
              Termin
            </Link>
          </Button>
        }
      />
      <EventsManager timezone={DEFAULT_TIMEZONE} />
    </div>
  );
}
