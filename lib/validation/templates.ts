import { z } from "zod";
import { normalizeReminderMinutes } from "@/lib/reminders";

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const eventTemplatePayloadSchema = z.object({
  name: z.string().trim().min(1, "Der Vorlagenname ist erforderlich."),
  titleTemplate: z.string().trim().min(1, "Die Titelvorlage ist erforderlich."),
  categoryId: z.string().trim().min(1, "Bitte waehle eine Kategorie."),
  locationTemplateId: z.preprocess(emptyStringToNull, z.string().trim().min(1).nullable()),
  defaultDurationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Die Standarddauer muss mindestens 1 Minute sein."),
  defaultDescription: z.preprocess(emptyStringToNull, z.string().max(4000).nullable()),
  defaultReminderMinutes: z
    .array(z.coerce.number().int().positive())
    .transform((value) => normalizeReminderMinutes(value)),
  isAllDayDefault: z.boolean(),
  isActive: z.boolean(),
});

export type EventTemplatePayload = z.infer<typeof eventTemplatePayloadSchema>;
