import { z } from "zod";

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const calendarSourceUpdateSchema = z.object({
  id: z.string().trim().min(1, "Kalender-ID fehlt."),
  displayName: z.string().trim().min(1, "Der Anzeigename ist erforderlich."),
  color: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/, "Die Farbe muss als HEX-Wert wie #2563EB vorliegen.")
      .nullable(),
  ),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, "Die Sortierung darf nicht negativ sein."),
});

export const updateCalendarSourcesPayloadSchema = z.object({
  calendars: z.array(calendarSourceUpdateSchema).min(1, "Mindestens ein Kalender ist erforderlich."),
});

export type UpdateCalendarSourcesPayload = z.infer<typeof updateCalendarSourcesPayloadSchema>;
