import { Header } from "@/components/layout/header";
import { LocationTemplateManager } from "@/components/locations/location-template-manager";

export const metadata = {
  title: "Standorte",
};

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Standortvorlagen"
        title="Adressen und Standardtexte zentral pflegen"
        description="Standortvorlagen landen lokal in PostgreSQL und koennen spaeter DESCRIPTION und LOCATION fuer Events vorbelegen."
      />
      <LocationTemplateManager />
    </div>
  );
}
