"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  applyDurationToLocalDateTime,
  appendLinkToDescription,
  combineLocalDateTimeToIso,
} from "@/lib/event-time";
import type { EventRecurrenceInput, RecurrenceWeekday } from "@/lib/recurrence/types";
import { parseReminderInput, remindersToInputString } from "@/lib/reminders";
import type {
  CalendarSourceRecord,
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";
import { DeleteEventDialog } from "@/components/events/delete-event-dialog";
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

type EventFormInitialValues = {
  href?: string;
  etag?: string;
  calendarId: string;
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
  recurrence: EventRecurrenceInput;
  templateId: string;
};

type EventFormProps = {
  mode: "create" | "edit";
  timezone: string;
  categories: CategoryRecord[];
  calendarSources: CalendarSourceRecord[];
  locations: LocationTemplateRecord[];
  templates: EventTemplateRecord[];
  initialValues: EventFormInitialValues;
  isSaving: boolean;
  onSubmit: (payload: EventSubmitPayload) => Promise<void>;
  onDelete?: () => Promise<void>;
  isDeleting?: boolean;
};

type EventSubmitPayload = {
  href?: string;
  etag?: string;
  calendarId?: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  category: string;
  reminders: number[];
  recurrence?: EventRecurrenceInput | null;
};

type RecurrenceBuildResult =
  | {
      error: string;
    }
  | {
      recurrence: EventRecurrenceInput;
    }
  | null;

type EventValidationResult =
  | {
      error: string;
    }
  | {
      payload: EventSubmitPayload;
    };

const NONE_OPTION = "__none__";
const weekdayOptions: Array<{ value: RecurrenceWeekday; label: string }> = [
  { value: "MO", label: "Mo" },
  { value: "TU", label: "Di" },
  { value: "WE", label: "Mi" },
  { value: "TH", label: "Do" },
  { value: "FR", label: "Fr" },
  { value: "SA", label: "Sa" },
  { value: "SU", label: "So" },
];

export function EventForm({
  mode,
  timezone,
  categories,
  calendarSources,
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
  const getDefaultRecurrenceWeekday = () => {
    const weekdayIndex = new Date(`${values.startDate}T12:00:00Z`).getUTCDay();
    return weekdayOptions[(weekdayIndex + 6) % 7]?.value ?? "MO";
  };

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

  const updateRecurrence = (nextRecurrence: Partial<EventRecurrenceInput>) => {
    setValues((current) => ({
      ...current,
      recurrence: {
        ...current.recurrence,
        ...nextRecurrence,
      },
    }));
  };

  const toggleRecurrenceWeekday = (weekday: RecurrenceWeekday) => {
    setValues((current) => {
      const currentDays = current.recurrence.byWeekdays ?? [];
      const nextDays = currentDays.includes(weekday)
        ? currentDays.filter((value) => value !== weekday)
        : [...currentDays, weekday];

      return {
        ...current,
        recurrence: {
          ...current.recurrence,
          byWeekdays: nextDays,
        },
      };
    });
  };

  const buildRecurrencePayload = (): RecurrenceBuildResult => {
    if (values.recurrence.preset === "none") {
      return null;
    }

    const endMode = values.recurrence.endMode ?? "never";
    const frequency =
      values.recurrence.preset === "custom"
        ? values.recurrence.frequency ?? "WEEKLY"
        : undefined;
    const interval =
      values.recurrence.preset === "custom"
        ? Number(values.recurrence.interval ?? 1)
        : values.recurrence.interval;
    const byWeekdays =
      values.recurrence.preset === "weekly" ||
      values.recurrence.preset === "biweekly" ||
      frequency === "WEEKLY"
        ? values.recurrence.byWeekdays ?? []
        : [];

    if (
      (values.recurrence.preset === "weekly" ||
        values.recurrence.preset === "biweekly" ||
        frequency === "WEEKLY") &&
      byWeekdays.length === 0
    ) {
      return {
        error: "Bitte wähle mindestens einen Wochentag für die Wiederholung.",
      };
    }

    if (endMode === "count" && (!values.recurrence.count || values.recurrence.count < 1)) {
      return {
        error: "Bitte gib eine gültige Anzahl für das Wiederholungsende an.",
      };
    }

    if (endMode === "until" && !values.recurrence.until) {
      return {
        error: "Bitte wähle ein Enddatum für die Wiederholung.",
      };
    }

    return {
      recurrence: {
        preset: values.recurrence.preset,
        frequency,
        interval,
        byWeekdays,
        endMode,
        count: endMode === "count" ? Number(values.recurrence.count) : undefined,
        until: endMode === "until" ? values.recurrence.until : undefined,
      } satisfies EventRecurrenceInput,
    };
  };

  const validateAndBuildPayload = (): EventValidationResult => {
    const title = values.title.trim();

    if (!title) {
      return {
        error: "Titel darf nicht leer sein.",
      };
    }

    if (!values.calendarId) {
      return {
        error: "Bitte wähle einen Zielkalender.",
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

    const recurrenceResult = buildRecurrencePayload();

    if (recurrenceResult && "error" in recurrenceResult) {
      return recurrenceResult;
    }

    return {
      payload: {
        href: values.href,
        etag: values.etag,
        calendarId: values.calendarId,
        title,
        description: appendLinkToDescription(values.description, values.link) || null,
        location: values.location.trim() || null,
        start: startIso,
        end: endIso,
        allDay: values.allDay,
        category: values.category,
        reminders: parseReminderInput(values.reminderInput),
        recurrence: recurrenceResult?.recurrence ?? null,
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
          <CardDescription>Direkt in Nextcloud speichern.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label>Terminvorlage</Label>
                  <InfoPopover
                    description="Vorlagen übernehmen Titel, Beschreibung, Erinnerungen und optional Standortdaten in das Formular."
                    title="Vorlagen"
                  />
                </div>
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
                  onChange={(formEvent) =>
                    setValues((current) => ({ ...current, title: formEvent.target.value }))
                  }
                  required
                  value={values.title}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zielkalender</Label>
              <Select
                disabled={mode === "edit" || calendarSources.length <= 1}
                onValueChange={(value) =>
                  setValues((current) => ({ ...current, calendarId: value }))
                }
                value={values.calendarId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kalender wählen" />
                </SelectTrigger>
                <SelectContent>
                  {calendarSources.map((calendarSource) => (
                    <SelectItem key={calendarSource.id} value={calendarSource.id}>
                      {calendarSource.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === "edit" ? (
                <p className="text-xs text-muted-foreground">
                  Der Ursprungskalender bleibt bei bestehenden Terminen fest.
                </p>
              ) : null}
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
                  onChange={(formEvent) =>
                    setValues((current) => ({ ...current, reminderInput: formEvent.target.value }))
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
                  Wird als ganztägiger CalDAV-Termin gespeichert.
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

            <div className="space-y-4 rounded-2xl border border-border bg-white/70 px-4 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="font-medium">Wiederholung</p>
                  <InfoPopover
                    description="Serientermine werden in dieser Version nur auf Serienebene bearbeitet oder gelöscht. Einzelne Vorkommen lassen sich nicht separat ändern oder verschieben."
                    title="Serientermine"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Serien werden in dieser Version nur als ganze Reihe bearbeitet oder gelöscht.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label>Wiederholungsart</Label>
                  <Select
                    onValueChange={(preset) =>
                      setValues((current) => ({
                        ...current,
                        recurrence:
                          preset === "none"
                            ? {
                                preset: "none",
                                frequency: "WEEKLY",
                                interval: 1,
                                byWeekdays: [],
                                endMode: "never",
                              }
                            : preset === "daily"
                              ? {
                                  preset: "daily",
                                  frequency: "DAILY",
                                  interval: 1,
                                  byWeekdays: [],
                                  endMode: "never",
                                }
                              : preset === "weekly"
                                ? {
                                    preset: "weekly",
                                    frequency: "WEEKLY",
                                    interval: 1,
                                    byWeekdays:
                                      current.recurrence.byWeekdays?.length
                                        ? current.recurrence.byWeekdays
                                        : [getDefaultRecurrenceWeekday()],
                                    endMode: current.recurrence.endMode ?? "never",
                                    count: current.recurrence.count,
                                    until: current.recurrence.until,
                                  }
                                : preset === "biweekly"
                                  ? {
                                      preset: "biweekly",
                                      frequency: "WEEKLY",
                                      interval: 2,
                                      byWeekdays:
                                        current.recurrence.byWeekdays?.length
                                          ? current.recurrence.byWeekdays
                                          : [getDefaultRecurrenceWeekday()],
                                      endMode: current.recurrence.endMode ?? "never",
                                      count: current.recurrence.count,
                                      until: current.recurrence.until,
                                    }
                                  : preset === "monthly"
                                    ? {
                                        preset: "monthly",
                                        frequency: "MONTHLY",
                                        interval: 1,
                                        byWeekdays: [],
                                        endMode: current.recurrence.endMode ?? "never",
                                        count: current.recurrence.count,
                                        until: current.recurrence.until,
                                      }
                                    : preset === "yearly"
                                      ? {
                                          preset: "yearly",
                                          frequency: "YEARLY",
                                          interval: 1,
                                          byWeekdays: [],
                                          endMode: current.recurrence.endMode ?? "never",
                                          count: current.recurrence.count,
                                          until: current.recurrence.until,
                                        }
                                      : {
                                          preset: "custom",
                                          frequency: current.recurrence.frequency ?? "WEEKLY",
                                          interval: current.recurrence.interval ?? 1,
                                          byWeekdays:
                                            current.recurrence.byWeekdays?.length
                                              ? current.recurrence.byWeekdays
                                              : [getDefaultRecurrenceWeekday()],
                                          endMode: current.recurrence.endMode ?? "never",
                                          count: current.recurrence.count,
                                          until: current.recurrence.until,
                                        },
                      }))
                    }
                    value={values.recurrence.preset}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Keine Wiederholung" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Wiederholung</SelectItem>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="biweekly">Alle 2 Wochen</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="yearly">Jährlich</SelectItem>
                      <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {values.recurrence.preset !== "none" ? (
                  <div className="space-y-2">
                    <Label>Ende der Wiederholung</Label>
                    <Select
                      onValueChange={(value) =>
                        updateRecurrence({
                          endMode: value === "count" || value === "until" ? value : "never",
                        })
                      }
                      value={values.recurrence.endMode ?? "never"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nie</SelectItem>
                        <SelectItem value="count">Nach Anzahl</SelectItem>
                        <SelectItem value="until">An Datum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              {values.recurrence.preset === "custom" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequenz</Label>
                    <Select
                      onValueChange={(value) =>
                        updateRecurrence({
                          frequency:
                            value === "DAILY" || value === "WEEKLY" || value === "MONTHLY" || value === "YEARLY"
                              ? value
                              : "WEEKLY",
                        })
                      }
                      value={values.recurrence.frequency ?? "WEEKLY"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wöchentlich" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Täglich</SelectItem>
                        <SelectItem value="WEEKLY">Wöchentlich</SelectItem>
                        <SelectItem value="MONTHLY">Monatlich</SelectItem>
                        <SelectItem value="YEARLY">Jährlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-recurrence-interval">Intervall</Label>
                    <Input
                      id="event-recurrence-interval"
                      min={1}
                      onChange={(formEvent) =>
                        updateRecurrence({
                          interval: Number(formEvent.target.value) || 1,
                        })
                      }
                      type="number"
                      value={String(values.recurrence.interval ?? 1)}
                    />
                  </div>
                </div>
              ) : null}

              {(values.recurrence.preset === "weekly" ||
                values.recurrence.preset === "biweekly" ||
                (values.recurrence.preset === "custom" && values.recurrence.frequency === "WEEKLY")) ? (
                <div className="space-y-2">
                  <Label>Wochentage</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map((weekday) => {
                      const isSelected = (values.recurrence.byWeekdays ?? []).includes(weekday.value);

                      return (
                        <Button
                          key={weekday.value}
                          onClick={() => toggleRecurrenceWeekday(weekday.value)}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                        >
                          {weekday.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {values.recurrence.preset !== "none" && values.recurrence.endMode === "count" ? (
                <div className="space-y-2">
                  <Label htmlFor="event-recurrence-count">Anzahl Wiederholungen</Label>
                  <Input
                    id="event-recurrence-count"
                    min={1}
                    onChange={(formEvent) =>
                      updateRecurrence({
                        count: Number(formEvent.target.value) || 1,
                      })
                    }
                    type="number"
                    value={String(values.recurrence.count ?? 10)}
                  />
                </div>
              ) : null}

              {values.recurrence.preset !== "none" && values.recurrence.endMode === "until" ? (
                <div className="space-y-2">
                  <Label htmlFor="event-recurrence-until">Wiederholen bis</Label>
                  <Input
                    id="event-recurrence-until"
                    onChange={(formEvent) =>
                      updateRecurrence({
                        until: formEvent.target.value,
                      })
                    }
                    type="date"
                    value={values.recurrence.until ?? values.startDate}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-start-date">Startdatum</Label>
                <Input
                  id="event-start-date"
                  onChange={(formEvent) =>
                    setValues((current) => ({ ...current, startDate: formEvent.target.value }))
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
                  onChange={(formEvent) =>
                    setValues((current) => ({ ...current, endDate: formEvent.target.value }))
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
                    onChange={(formEvent) =>
                      setValues((current) => ({ ...current, startTime: formEvent.target.value }))
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
                    onChange={(formEvent) =>
                      setValues((current) => ({ ...current, endTime: formEvent.target.value }))
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
                  onChange={(formEvent) =>
                    setValues((current) => ({ ...current, location: formEvent.target.value }))
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
                  onChange={(formEvent) =>
                    setValues((current) => ({ ...current, link: formEvent.target.value }))
                  }
                  placeholder="https://..."
                  value={values.link}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">Beschreibung</Label>
                <Textarea
                  id="event-description"
                  onChange={(formEvent) =>
                    setValues((current) => ({ ...current, description: formEvent.target.value }))
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
                <Button onClick={() => setIsDeleteDialogOpen(true)} type="button" variant="outline">
                  {values.recurrence.preset === "none" ? "Termin löschen" : "Serie löschen"}
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Änderungen werden direkt mit Nextcloud synchronisiert.
                </span>
              )}
              <Button
                disabled={
                  isSaving ||
                  categories.length === 0 ||
                  (mode === "create" && calendarSources.length === 0)
                }
                type="submit"
              >
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
