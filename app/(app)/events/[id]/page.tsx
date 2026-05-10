import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        description={`Die Event-Bearbeitung für "${id}" wird nach dem CalDAV-Service über href und ETag abgesichert.`}
      />

      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>Update per If-Match</CardTitle>
          <CardDescription>
            Konflikte mit iPhone oder Nextcloud-Weboberfläche werden später verständlich angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Noch kein Live-Abruf. Die Route ist nur bewusst schon im finalen URL-Schema angelegt.
        </CardContent>
      </Card>
    </div>
  );
}
