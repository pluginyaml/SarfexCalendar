import Link from "next/link";
import { Header } from "@/components/layout/header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { Button } from "@/components/ui/button";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

const focusItems = [
  "CalDAV bleibt die einzige Quelle der Wahrheit fuer echte Termine.",
  "Kategorien, Vorlagen und Orte werden lokal gepflegt und ergaenzen den Kalender.",
  "Aenderungen erscheinen direkt in Nextcloud und auf verbundenen Geraeten.",
];

const workflowItems = [
  "Termin anlegen oder bearbeiten",
  "Naechste Pruefung und Onlineeinheit ueberblicken",
  "Deadlines und heutige Termine mit einem Blick erfassen",
];

export default function DashboardPage() {
  return (
    <div className="space-y-3">
      <Header
        eyebrow="Dashboard"
        title="Kontrollzentrum"
        description="Ein ruhiger Ueberblick ueber die naechsten Termine, Sync-Status und deinen aktuellen Fokus."
        actions={
          <Button asChild className="rounded-[0.7rem] px-2.5 text-[11px]" size="sm">
            <Link href="/events/new">+ Termin</Link>
          </Button>
        }
      />

      <DashboardOverview timezone={DEFAULT_TIMEZONE} />

      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1rem] border border-black/6 bg-white/84 p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Fokus
          </p>
          <ul className="mt-2 space-y-2 text-[12px] leading-5 text-foreground">
            {workflowItems.map((item) => (
              <li className="border-b border-black/6 pb-2 last:border-b-0 last:pb-0" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1rem] border border-black/6 bg-white/84 p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            System
          </p>
          <ul className="mt-2 space-y-2 text-[12px] leading-5 text-muted-foreground">
            {focusItems.map((item) => (
              <li className="border-b border-black/6 pb-2 last:border-b-0 last:pb-0" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
