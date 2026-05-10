import { z } from "zod";
import { normalizeReminderMinutes } from "@/lib/reminders";

export const categoryPayloadSchema = z.object({
  name: z.string().trim().min(1, "Der Kategoriename ist erforderlich."),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Die Farbe muss als HEX-Wert wie #2563EB vorliegen."),
  icon: z.string().trim().min(1, "Bitte waehle ein Icon."),
  defaultDurationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Die Standarddauer muss mindestens 1 Minute sein."),
  defaultReminderMinutes: z
    .array(z.coerce.number().int().positive())
    .transform((value) => normalizeReminderMinutes(value)),
  sortOrder: z.coerce.number().int().min(0, "Die Sortierung darf nicht negativ sein."),
  isActive: z.boolean(),
});

export type CategoryPayload = z.infer<typeof categoryPayloadSchema>;
