import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Kategorien",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kategorien"
        title="Farben, Icons und Standarderinnerungen"
        description="Die Standardkategorien sind bereits im Seed vorbereitet und werden als nächste Fachschicht an das UI angeschlossen."
      />

      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>Seed-Konzept steht</CardTitle>
          <CardDescription>
            Onlineeinheit, Vorkurs, Präsenzphase, Prüfung, Deadline, Arbeit, Privat, Sonstiges.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Bearbeitbar werden Name, Farbe, Icon, Dauer, Erinnerungen, Sortierung und Aktivstatus.
        </CardContent>
      </Card>
    </div>
  );
}
