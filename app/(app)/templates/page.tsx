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
        title="Vorlagen verwalten"
        description="Häufige Terminmuster für neue Events."
      />
      <EventTemplateManager />
    </div>
  );
}
