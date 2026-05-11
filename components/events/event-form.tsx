"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  applyDurationToLocalDateTime,
  appendLinkToDescription,
  combineLocalDateTimeToIso,
} from "@/lib/event-time";
import { parseReminderInput, remindersToInputString } from "@/lib/reminders";
import type {
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";
import { DeleteEventDialog } from "@/components/events/delete-event-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type EventFormInitialValues = {
  href?: string;
  etag?: string;
  title: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  locationTemplateId: string;
  description: string;
  link: string;
  reminderInput: string;
  templateId: string;
};

type EventFormProps = {
  mode: "create" | "edit";
  timezone: string;
  categories: CategoryRecord[];
  locations: LocationTemplateRecord[];
  templates: EventTemplateRecord[];
  initialValues: EventFormInitialValues;
  isSaving: boolean;
  onSubmit: (payload: {
    href?: string;
    etag?: string;
    title: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    allDay: boolean;
    category: string;
    reminders: number[];
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
};

const NONE_OPTION = "__none__";

export function EventForm({
  mode,
  timezone,
  categories,
  locations,
  templates,
  initialValues,
  isSaving,
  isDeleting,
  onSubmit,
  onDelete,
}: EventFormProps) {
  const [values, setValues] = useState<EventFormInitialValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const applyCategoryDefaults = (categoryName: string, draft: EventFormInitialValues) => {
    const category = categories.find((item) => item.name === categoryName);

    if (!category) {
      return draft;
    }

    const nextValues = {
      ...draft,
      category: category.name,
      reminderInput: remindersToInputString(category.defaultReminderMinutes),
    };

    if (!nextValues.allDay && nextValues.startDate && nextValues.startTime) {
      const endValues = applyDurationToLocalDateTime(
        nextValues.startDate,
        nextValues.startTime,
        category.defaultDurationMinutes,
        timezone,
      );

      nextValues.endDate = endValues.endDate;
      nextValues.endTime = endValues.endTime;
    }

    return nextValues;
  };

  const applyLocationTemplate = (locationTemplateId: string, draft: EventFormInitialValues) => {
    if (locationTemplateId === NONE_OPTION) {
      return {
        ...draft,
        locationTemplateId,
      };
    }

    const locationTemplate = locations.find((item) => item.id === locationTemplateId);

    if (!locationTemplate) {
      return draft;
    }

    return {
      ...draft,
      locationTemplateId,
      location: locationTemplate.address,
      description: locationTemplate.defaultDescription ?? draft.description,
      link: locationTemplate.link ?? draft.link,
    };
  };

  const applyEventTemplate = (templateId: string) => {
    if (templateId === NONE_OPTION) {
      setValues((current) => ({ ...current, templateId }));
      return;
    }

    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    setValues((current) => {
      let nextValues: EventFormInitialValues = {
        ...current,
        templateId,
        title: template.titleTemplate,
        category: template.categoryName,
        allDay: template.isAllDayDefault,
        description: template.defaultDescription ?? current.description,
        reminderInput: remindersToInputString(template.defaultReminderMinutes),
      };

      nextValues = applyLocationTemplate(template.locationTemplateId ?? NONE_OPTION, nextValues);

      if (nextValues.allDay) {
        nextValues.endDate = nextValues.startDate;
      } else if (nextValues.startDate && nextValues.startTime) {
        const endValues = applyDurationToLocalDateTime(
          nextValues.startDate,
          nextValues.startTime,
          template.defaultDurationMinutes,
          timezone,
        );

        nextValues.endDate = endValues.endDate;
        nextValues.endTime = endValues.endTime;
      }

      return nextValues;
    });
  };

  const validateAndBuildPayload = () => {
    const title = values.title.trim();

    if (!title) {
      return {
        error: "Titel darf nicht leer sein.",
      };
    }

    if (!values.category) {
      return {
        error: "Bitte wähle eine Kategorie.",
      };
    }

    if (!values.startDate || !values.endDate) {
      return {
        error: "Bitte setze Start- und Enddatum.",
      };
    }

    if (!values.allDay && (!values.startTime || !values.endTime)) {
      return {
        error: "Bitte setze Start- und Endzeit.",
      };
    }

    if (values.allDay && values.endDate < values.startDate) {
      return {
        error: "Das Enddatum muss am selben Tag oder später liegen.",
      };
    }

    const startIso = values.allDay
      ? values.startDate
      : combineLocalDateTimeToIso(values.startDate, values.startTime, timezone);
    const endIso = values.allDay
      ? values.endDate
      : combineLocalDateTimeToIso(values.endDate, values.endTime, timezone);

    if (!values.allDay && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      return {
        error: "Endzeit muss nach Startzeit liegen.",
      };
    }

    return {
      payload: {
        href: values.href,
        etag: values.etag,
        title,
        description: appendLinkToDescription(values.description, values.link) || null,
        location: values.location.trim() || null,
        start: startIso,
        end: endIso,
        allDay: values.allDay,
        category: values.category,
        reminders: parseReminderInput(values.reminderInput),
      },
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const result = validateAndBuildPayload();

    if ("error" in result) {
      setError(result.error ?? "Bitte prüfe deine Eingaben.");
      return;
    }

    try {
      await onSubmit(result.payload);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Termin konnte nicht gespeichert werden.";
      setError(message);
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    try {
      await onDelete();
      setIsDeleteDialogOpen(false);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Termin konnte nicht gelöscht werden.",
      );
    }
  };

  return (
    <>
      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Neuen Termin anlegen" : "Termin bearbeiten"}</CardTitle>
          <CardDescription>
            Echte Termine werden direkt über Nextcloud CalDAV gespeichert. Lokal bleiben nur deine Metadaten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label>Terminvorlage</Label>
                <Select onValueChange={applyEventTemplate} value={values.templateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional aus Vorlage füllen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_OPTION}>Keine Vorlage</SelectItem>
                    {templates.filter((template) => template.isActive).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-title">Titel</Label>
                <Input
                  id="event-title"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                  value={values.title}
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select
                  onValueChange={(value) =>
                    setValues((current) => applyCategoryDefaults(value, { ...current, category: value }))
                  }
                  value={values.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-reminders">Erinnerungen in Minuten</Label>
                <Input
                  id="event-reminders"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, reminderInput: event.target.value }))
                  }
                  placeholder="10080, 1440, 120"
                  value={values.reminderInput}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 px-4 py-3">
              <div>
                <p className="font-medium">Ganztägig</p>
                <p className="text-sm text-muted-foreground">
                  Ganztagstermine werden als DATE in der ICS-Datei gespeichert.
                </p>
              </div>
              <Switch
                checked={values.allDay}
                onCheckedChange={(checked) =>
                  setValues((current) => ({
                    ...current,
                    allDay: checked,
                    endDate: checked ? current.startDate : current.endDate,
                    startTime: checked ? current.startTime : current.startTime || "09:00",
                    endTime: checked ? current.endTime : current.endTime || "10:00",
                  }))
                }
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-start-date">Startdatum</Label>
                <Input
                  id="event-start-date"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, startDate: event.target.value }))
                  }
                  required
                  type="date"
                  value={values.startDate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end-date">Enddatum</Label>
                <Input
                  id="event-end-date"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, endDate: event.target.value }))
                  }
                  required
                  type="date"
                  value={values.endDate}
                />
              </div>
            </div>

            {!values.allDay ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-start-time">Startzeit</Label>
                  <Input
                    id="event-start-time"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, startTime: event.target.value }))
                    }
                    required
                    type="time"
                    value={values.startTime}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end-time">Endzeit</Label>
                  <Input
                    id="event-end-time"
                    onChange={(event) =>
                      setValues((current) => ({ ...current, endTime: event.target.value }))
                    }
                    required
                    type="time"
                    value={values.endTime}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label>Standortvorlage</Label>
                <Select
                  onValueChange={(value) =>
                    setValues((current) => applyLocationTemplate(value, { ...current }))
                  }
                  value={values.locationTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_OPTION}>Keine Standortvorlage</SelectItem>
                    {locations.filter((location) => location.isActive).map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">Standort</Label>
                <Input
                  id="event-location"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, location: event.target.value }))
                  }
                  value={values.location}
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-link">Link</Label>
                <Input
                  id="event-link"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, link: event.target.value }))
                  }
                  placeholder="https://..."
                  value={values.link}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">Beschreibung</Label>
                <Textarea
                  id="event-description"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, description: event.target.value }))
                  }
                  value={values.description}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {onDelete ? (
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  type="button"
                  variant="outline"
                >
                  Termin löschen
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Neue Termine erscheinen nach dem Speichern direkt in Nextcloud und auf dem iPhone.
                </span>
              )}
              <Button disabled={isSaving || categories.length === 0} type="submit">
                {isSaving
                  ? "Speichert..."
                  : mode === "create"
                    ? "Termin speichern"
                    : "Änderungen speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {onDelete ? (
        <DeleteEventDialog
          isPending={Boolean(isDeleting)}
          onConfirm={handleDelete}
          onOpenChange={setIsDeleteDialogOpen}
          open={isDeleteDialogOpen}
          title={values.title || "Diesen Termin"}
        />
      ) : null}
    </>
  );
}

export type { EventFormInitialValues };
