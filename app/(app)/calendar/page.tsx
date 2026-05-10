import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Kalender",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kalender"
        title="Tages-, Wochen- und Monatsansicht"
        description="Die Oberfläche ist vorbereitet. Die eigentlichen Event-Blöcke werden nach dem CalDAV-Service direkt mit Nextcloud-Daten befüllt."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {[
          ["Tag", "Detailansicht für einzelne Lerntage und Prüfungen."],
          ["Woche", "Montag als Wochenstart, mobil später horizontal scrollbar."],
          ["Monat", "Ruhige Gesamtübersicht mit farbigen Kategorien."],
        ].map(([title, description]) => (
          <Card key={title} className="card-shadow border-white/70 bg-card/90">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Platzhalteransicht bis die CalDAV-Event-Transformation fertig ist.
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
