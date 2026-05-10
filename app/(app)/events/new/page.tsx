import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Neuer Termin",
};

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Neuer Termin"
        title="Terminformular vorbereiten"
        description="Pflichtfelder, All-Day-Handling, Vorlagen und Erinnerungen werden im Event-Schritt umgesetzt."
      />

      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>Formular-Blueprint</CardTitle>
          <CardDescription>
            Das Formular wird später Kategorie, Dauer, Standortvorlagen und Reminder sauber
            vorbefüllen.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Noch nicht mit Zod und CalDAV verbunden.
        </CardContent>
      </Card>
    </div>
  );
}
