import { z } from "zod";
import {
  recurrenceEndModes,
  recurrenceFrequencies,
  recurrencePresets,
  recurrenceWeekdays,
} from "@/lib/recurrence/types";

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidDateTimeString(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function createDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

export const eventRangeQuerySchema = z
  .object({
    start: z.string().min(1, "start fehlt."),
    end: z.string().min(1, "end fehlt."),
    calendarIds: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (!isValidDateTimeString(value.start) || !isValidDateTimeString(value.end)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Der Zeitraum ist ungültig.",
      });
      return;
    }

    if (new Date(value.end).getTime() <= new Date(value.start).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Das Ende des Zeitraums muss nach dem Start liegen.",
      });
    }
  });

export const eventDetailQuerySchema = z.object({
  href: z.string().min(1, "href fehlt."),
});

const recurrenceSchema = z
  .object({
    preset: z.enum(recurrencePresets),
    frequency: z.enum(recurrenceFrequencies).optional(),
    interval: z.number().int().positive().optional(),
    byWeekdays: z.array(z.enum(recurrenceWeekdays)).optional(),
    endMode: z.enum(recurrenceEndModes).optional(),
    count: z.number().int().positive().optional(),
    until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .superRefine((value, context) => {
    if (value.preset === "none") {
      return;
    }

    const endMode = value.endMode ?? "never";

    if (value.preset === "custom" && !value.frequency) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bei benutzerdefinierter Wiederholung fehlt die Frequenz.",
      });
    }

    if ((value.frequency === "WEEKLY" || value.preset === "weekly" || value.preset === "biweekly") && value.byWeekdays?.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wöchentliche Wiederholungen brauchen mindestens einen Wochentag.",
      });
    }

    if (endMode === "count" && !value.count) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bitte gib eine Anzahl für das Wiederholungsende an.",
      });
    }

    if (endMode === "until" && !value.until) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bitte gib ein Enddatum für die Wiederholung an.",
      });
    }
  });

const baseEventPayloadSchema = z
  .object({
    calendarId: z.string().trim().min(1, "Der Zielkalender fehlt.").optional(),
    title: z.string().trim().min(1, "Der Titel ist erforderlich."),
    description: z.string().trim().nullable().optional(),
    location: z.string().trim().nullable().optional(),
    start: z.string().min(1, "Der Start ist erforderlich."),
    end: z.string().min(1, "Das Ende ist erforderlich."),
    allDay: z.boolean(),
    category: z.string().trim().min(1, "Die Kategorie ist erforderlich."),
    reminders: z.array(z.coerce.number().int().positive()).default([]),
    recurrence: recurrenceSchema.nullish(),
  })
  .superRefine((value, context) => {
    if (value.allDay) {
      if (!isValidDateString(value.start) || !isValidDateString(value.end)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ganztagstermine müssen als Datum übergeben werden.",
        });
        return;
      }

      if (createDate(value.end).getTime() < createDate(value.start).getTime()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Das Enddatum muss am selben Tag oder später liegen.",
        });
      }

      return;
    }

    if (!isValidDateTimeString(value.start) || !isValidDateTimeString(value.end)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start- oder Endzeit ist ungültig.",
      });
      return;
    }

    if (new Date(value.end).getTime() <= new Date(value.start).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endzeit muss nach Startzeit liegen.",
      });
    }
  });

export const createEventPayloadSchema = baseEventPayloadSchema;

export const updateEventPayloadSchema = baseEventPayloadSchema.extend({
  href: z.string().min(1, "href fehlt."),
  etag: z.string().min(1, "etag fehlt."),
});

export const deleteEventPayloadSchema = z.object({
  href: z.string().min(1, "href fehlt."),
  etag: z.string().min(1, "etag fehlt."),
});

export type CreateEventPayload = z.infer<typeof createEventPayloadSchema>;
export type UpdateEventPayload = z.infer<typeof updateEventPayloadSchema>;
