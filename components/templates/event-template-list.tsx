"use client";

import { FileStack, PencilLine, Plus } from "lucide-react";
import type { EventTemplateRecord } from "@/types/entities";
import { formatReminderMinutes } from "@/lib/reminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EventTemplateListProps = {
  templates: EventTemplateRecord[];
  selectedTemplateId: string | null;
  onCreate: () => void;
  onSelect: (template: EventTemplateRecord) => void;
};

export function EventTemplateList({
  templates,
  selectedTemplateId,
  onCreate,
  onSelect,
}: EventTemplateListProps) {
  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Terminvorlagen</CardTitle>
          <CardDescription>Vordefinierte Titel, Kategorien, Dauern und Reminder.</CardDescription>
        </div>
        <Button onClick={onCreate} size="sm" type="button" variant="secondary">
          <Plus className="size-4" />
          Neu
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Noch keine Terminvorlagen vorhanden.
          </div>
        ) : (
          templates.map((template) => (
            <button
              key={template.id}
              className={cn(
                "flex w-full flex-col rounded-[1.5rem] border px-4 py-4 text-left transition-colors",
                template.id === selectedTemplateId
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white/70 hover:bg-secondary/50",
              )}
              onClick={() => onSelect(template)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <FileStack className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.categoryName}
                      {template.locationTemplateName ? `, ${template.locationTemplateName}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {template.defaultDurationMinutes} Min, {formatReminderMinutes(template.defaultReminderMinutes)}
                    </p>
                  </div>
                </div>
                <PencilLine className="mt-1 size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={template.isActive ? "default" : "outline"}>
                  {template.isActive ? "Aktiv" : "Inaktiv"}
                </Badge>
                {template.isAllDayDefault ? <Badge variant="secondary">Ganztag</Badge> : null}
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
