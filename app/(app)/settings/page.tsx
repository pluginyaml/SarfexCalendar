import { Header } from "@/components/layout/header";
import { SettingsManager } from "@/components/settings/settings-manager";

export const metadata = {
  title: "Einstellungen",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Einstellungen"
        title="CalDAV-Verbindung und UI-Vorgaben"
        description="Hier landen der spätere Verbindungstest, die Standardansicht, der Wochenstart und die Zeitzone Europe/Berlin."
      />
      <SettingsManager />
    </div>
  );
}
