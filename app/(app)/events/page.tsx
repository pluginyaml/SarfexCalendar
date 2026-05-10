import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Termine",
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Termine"
        title="Chronologische Listenansicht"
        description="Hier entsteht die filterbare 6-Monats-Liste mit Suche, Kategorie- und Standortfilter."
        actions={
          <Button asChild>
            <Link href="/events/new">+ Termin</Link>
          </Button>
        }
      />

      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>Listendarstellung</CardTitle>
          <CardDescription>
            Die Daten werden später direkt per CalDAV im gewünschten Zeitraum geladen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>Suche, Kategorien, Standortfilter und Monatsgruppierung folgen nach dem CRUD-Schritt.</p>
          <p>Die App bleibt build-stabil, obwohl die fachlichen Teile noch nacheinander dazukommen.</p>
        </CardContent>
      </Card>
    </div>
  );
}
