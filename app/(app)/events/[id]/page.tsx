import { Header } from "@/components/layout/header";
import { EventEditor } from "@/components/events/event-editor";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

type EventDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Header
        eyebrow="Termin bearbeiten"
        title="Detailansicht"
        description={`Die Event-Bearbeitung für "${id}" ist über href und ETag konfliktgesichert.`}
      />
      <EventEditor eventId={id} mode="edit" timezone={DEFAULT_TIMEZONE} />
    </div>
  );
}
