"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { parseReminderInput, remindersToInputString } from "@/lib/reminders";
import type {
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type EventTemplateFormValues = {
  name: string;
  titleTemplate: string;
  categoryId: string;
  locationTemplateId: string;
  defaultDurationMinutes: number;
  defaultDescription: string;
  defaultReminderInput: string;
  isAllDayDefault: boolean;
  isActive: boolean;
};

type EventTemplateFormProps = {
  categories: CategoryRecord[];
  locations: LocationTemplateRecord[];
  template: EventTemplateRecord | null;
  isSaving: boolean;
  onDelete: (template: EventTemplateRecord) => void;
  onSubmit: (values: {
    name: string;
    titleTemplate: string;
    categoryId: string;
    locationTemplateId: string | null;
    defaultDurationMinutes: number;
    defaultDescription: string | null;
    defaultReminderMinutes: number[];
    isAllDayDefault: boolean;
    isActive: boolean;
  }) => Promise<void>;
};

const NONE_OPTION = "__none__";

function toFormValues(
  template: EventTemplateRecord | null,
  categories: CategoryRecord[],
): EventTemplateFormValues {
  if (!template) {
    return {
      name: "",
      titleTemplate: "",
      categoryId: categories[0]?.id ?? "",
      locationTemplateId: NONE_OPTION,
      defaultDurationMinutes: 60,
      defaultDescription: "",
      defaultReminderInput: "60",
      isAllDayDefault: false,
      isActive: true,
    };
  }

  return {
    name: template.name,
    titleTemplate: template.titleTemplate,
    categoryId: template.categoryId,
    locationTemplateId: template.locationTemplateId ?? NONE_OPTION,
    defaultDurationMinutes: template.defaultDurationMinutes,
    defaultDescription: template.defaultDescription ?? "",
    defaultReminderInput: remindersToInputString(template.defaultReminderMinutes),
    isAllDayDefault: template.isAllDayDefault,
    isActive: template.isActive,
  };
}

export function EventTemplateForm({
  categories,
  locations,
  template,
  isSaving,
  onDelete,
  onSubmit,
}: EventTemplateFormProps) {
  const form = useForm<EventTemplateFormValues>({
    defaultValues: toFormValues(template, categories),
  });

  useEffect(() => {
    form.reset(toFormValues(template, categories));
  }, [categories, form, template]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      titleTemplate: values.titleTemplate.trim(),
      categoryId: values.categoryId,
      locationTemplateId:
        values.locationTemplateId === NONE_OPTION ? null : values.locationTemplateId,
      defaultDurationMinutes: Number(values.defaultDurationMinutes),
      defaultDescription: values.defaultDescription.trim() || null,
      defaultReminderMinutes: parseReminderInput(values.defaultReminderInput),
      isAllDayDefault: values.isAllDayDefault,
      isActive: values.isActive,
    });
  });

  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader>
        <div className="flex items-center gap-1">
          <CardTitle>{template ? "Vorlage bearbeiten" : "Neue Vorlage"}</CardTitle>
          <InfoPopover
            description='Terminvorlagen übernehmen Titel, Kategorie, Dauer, Erinnerungen und optional eine Standortvorlage in neue Termine. Platzhalter wie {thema}, {fach} oder {modul} bleiben im Titel erhalten.'
            title="Terminvorlagen"
          />
        </div>
        <CardDescription>Titel-Platzhalter: {"{thema}"}, {"{fach}"}, {"{modul}"}.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input id="template-name" required {...form.register("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-title-template">Titelvorlage</Label>
            <Input
              id="template-title-template"
              placeholder="Onlineeinheit {fach} - {thema}"
              required
              {...form.register("titleTemplate")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>Standortvorlage</Label>
                <InfoPopover
                  description="Wenn du eine Standortvorlage verknüpfst, werden deren Adresse, Link und Standardbeschreibung später in neue Termine übernommen."
                  title="Standortübernahme"
                />
              </div>
              <Controller
                control={form.control}
                name="locationTemplateId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION}>Keine Standortvorlage</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template-duration">Standarddauer in Minuten</Label>
              <Input
                id="template-duration"
                min={1}
                required
                type="number"
                {...form.register("defaultDurationMinutes", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-reminders">Erinnerungen in Minuten</Label>
              <Input
                id="template-reminders"
                placeholder="60, 1440"
                {...form.register("defaultReminderInput")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Standardbeschreibung</Label>
            <Textarea id="template-description" {...form.register("defaultDescription")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 px-4 py-3">
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium">Ganztag standardmäßig</p>
                  <InfoPopover
                    description="Aktiviere das für Deadlines oder reine Tagesmarker ohne konkrete Uhrzeit."
                    title="Ganztag"
                  />
                </div>
              </div>
              <Controller
                control={form.control}
                name="isAllDayDefault"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 px-4 py-3">
              <div>
                <p className="font-medium">Aktiv</p>
                <p className="text-sm text-muted-foreground">
                  Nur aktive Vorlagen stehen in Formularen direkt bereit.
                </p>
              </div>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {template ? (
              <Button onClick={() => onDelete(template)} type="button" variant="outline">
                Löschen
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Vorlagen füllen neue Termine automatisch vor.
              </span>
            )}
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Speichert..." : template ? "Vorlage speichern" : "Vorlage anlegen"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
