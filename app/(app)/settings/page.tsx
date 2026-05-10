import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Einstellungen",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Einstellungen"
        title="CalDAV-Verbindung und UI-Vorgaben"
        description="Hier landen später Verbindungstest, Standardansicht, Wochenstart und die Zeitzone Europe/Berlin."
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="card-shadow border-white/70 bg-card/90">
          <CardHeader>
            <CardTitle>CalDAV-Status</CardTitle>
            <CardDescription>
              Runtime-Check gegen Nextcloud folgt nach der Service-Implementierung.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Die ENV-Struktur und die Validierungs-Helfer sind bereits vorbereitet.
          </CardContent>
        </Card>

        <Card className="card-shadow border-white/70 bg-card/90">
          <CardHeader>
            <CardTitle>UI-Einstellungen</CardTitle>
            <CardDescription>Standardansicht, Wochenstart und Zeitzone werden lokal gespeichert.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Keine echten Kalendertermine in der Datenbank, nur App-Metadaten.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
