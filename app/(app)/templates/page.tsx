import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Vorlagen",
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Terminvorlagen"
        title="Wiederkehrende Muster vorbereiten"
        description="Vorlagen werden lokal in PostgreSQL gespeichert und später direkt in das Event-Formular übernommen."
      />

      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>Geplante Felder</CardTitle>
          <CardDescription>
            Titelvorlage, Kategorie, Standarddauer, Erinnerungen und optionaler Standort.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Titel-Platzhalter wie {"{thema}"}, {"{fach}"} und {"{modul}"} werden im CRUD-Schritt
          mit vorbereitet.
        </CardContent>
      </Card>
    </div>
  );
}
