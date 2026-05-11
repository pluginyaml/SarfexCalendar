import { Header } from "@/components/layout/header";
import { EventTemplateManager } from "@/components/templates/event-template-manager";

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
      <EventTemplateManager />
    </div>
  );
}
