import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const overviewCards = [
  {
    title: "Heute",
    value: "0 Termine",
    description: "Wird nach dem CalDAV-Anschluss live aus Nextcloud geladen.",
  },
  {
    title: "Nächste 14 Tage",
    value: "Noch offen",
    description: "Die Range-Abfrage wird später auf einen festen Zeitraum begrenzt.",
  },
  {
    title: "Nächste Prüfung",
    value: "Noch nicht ermittelt",
    description: "Kategorien und Farben kommen aus der lokalen App-Datenbank.",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Dashboard"
        title="Übersicht für deinen Handelsfachwirt"
        description="Die stabile Basis steht. Im nächsten Schritt hängen wir Auth, Session-Schutz und die ersten echten Datenpfade an."
        actions={
          <Button asChild>
            <Link href="/events/new">+ Termin</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {overviewCards.map((card) => (
          <Card key={card.title} className="card-shadow border-white/70 bg-card/90">
            <CardHeader className="space-y-2">
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="card-shadow border-white/70 bg-card/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Nächste Ausbaustufen</CardTitle>
                <CardDescription>Die Reihenfolge bleibt strikt build-orientiert.</CardDescription>
              </div>
              <Badge variant="secondary">Stabil zuerst</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>1. Session-Login und geschützte Server-Routen.</p>
            <p>2. Prisma-CRUD für Kategorien, Vorlagen, Standorte und UI-Einstellungen.</p>
            <p>3. CalDAV-Service mit time-range Queries, ETag-Konflikten und ICS-Handling.</p>
            <p>4. Kalender- und Listen-UI mit echter Nextcloud-Synchronisation.</p>
          </CardContent>
        </Card>

        <Card className="card-shadow border-white/70 bg-card/90">
          <CardHeader>
            <CardTitle>CalDAV-Hinweis</CardTitle>
            <CardDescription>Noch kein Runtime-Test aktiv</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Die App speichert echte Termine bewusst nicht lokal. Änderungen laufen später direkt
              per CalDAV in deinen Nextcloud-Kalender.
            </p>
            <p>
              Lokale PostgreSQL-Daten werden nur für Kategorien, Standortvorlagen,
              Terminvorlagen und UI-Einstellungen verwendet.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
