import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Standorte",
};

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Standortvorlagen"
        title="Adressen und Standardtexte zentral pflegen"
        description="Standortvorlagen landen lokal in PostgreSQL und können später DESCRIPTION und LOCATION für Events vorbelegen."
      />

      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>Geplante Daten</CardTitle>
          <CardDescription>Name, Adresse, Link, Notiz und Standardbeschreibung.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Die Übernahme in LOCATION und DESCRIPTION wird nach dem CRUD-Teil direkt mit dem
          Terminformular gekoppelt.
        </CardContent>
      </Card>
    </div>
  );
}
