import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { Header } from "@/components/layout/header";
import { NewEventButton } from "@/components/layout/new-event-button";
import { QuickAdd } from "@/components/quick-add";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Header
        actions={<NewEventButton />}
        description="Dein schneller Überblick für die nächsten Termine."
        eyebrow="Dashboard"
        title="Kontrollzentrum"
      />

      <DashboardOverview timezone={DEFAULT_TIMEZONE} />

      <QuickAdd
        compact
        description="Freitext in einen neuen Termin-Entwurf umwandeln"
        timezone={DEFAULT_TIMEZONE}
      />
    </div>
  );
}
