import { z } from "zod";

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
  })
  .superRefine((value, context) => {
    if (!isValidDateTimeString(value.start) || !isValidDateTimeString(value.end)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Der Zeitraum ist ungueltig.",
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

const baseEventPayloadSchema = z
  .object({
    title: z.string().trim().min(1, "Der Titel ist erforderlich."),
    description: z.string().trim().nullable().optional(),
    location: z.string().trim().nullable().optional(),
    start: z.string().min(1, "Der Start ist erforderlich."),
    end: z.string().min(1, "Das Ende ist erforderlich."),
    allDay: z.boolean(),
    category: z.string().trim().min(1, "Die Kategorie ist erforderlich."),
    reminders: z.array(z.coerce.number().int().positive()).default([]),
  })
  .superRefine((value, context) => {
    if (value.allDay) {
      if (!isValidDateString(value.start) || !isValidDateString(value.end)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ganztagstermine muessen als Datum uebergeben werden.",
        });
        return;
      }

      if (createDate(value.end).getTime() < createDate(value.start).getTime()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Das Enddatum muss am selben Tag oder spaeter liegen.",
        });
      }

      return;
    }

    if (!isValidDateTimeString(value.start) || !isValidDateTimeString(value.end)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start- oder Endzeit ist ungueltig.",
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
