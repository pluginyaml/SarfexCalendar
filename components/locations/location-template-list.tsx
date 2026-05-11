"use client";

import { Link2, MapPinned, PencilLine, Plus } from "lucide-react";
import type { LocationTemplateRecord } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LocationTemplateListProps = {
  locations: LocationTemplateRecord[];
  selectedLocationId: string | null;
  onCreate: () => void;
  onSelect: (location: LocationTemplateRecord) => void;
};

export function LocationTemplateList({
  locations,
  selectedLocationId,
  onCreate,
  onSelect,
}: LocationTemplateListProps) {
  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Standortvorlagen</CardTitle>
          <CardDescription>Adressen, Links und Beschreibungstexte für Präsenztermine.</CardDescription>
        </div>
        <Button onClick={onCreate} size="sm" type="button" variant="secondary">
          <Plus className="size-4" />
          Neu
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {locations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Noch keine Standortvorlagen vorhanden.
          </div>
        ) : (
          locations.map((location) => (
            <button
              key={location.id}
              className={cn(
                "flex w-full flex-col rounded-[1.5rem] border px-4 py-4 text-left transition-colors",
                location.id === selectedLocationId
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white/70 hover:bg-secondary/50",
              )}
              onClick={() => onSelect(location)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <MapPinned className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{location.name}</p>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                    {location.link ? (
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <Link2 className="size-3.5" />
                        Link hinterlegt
                      </p>
                    ) : null}
                  </div>
                </div>
                <PencilLine className="mt-1 size-4 text-muted-foreground" />
              </div>
              <div className="mt-3">
                <Badge variant={location.isActive ? "default" : "outline"}>
                  {location.isActive ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
