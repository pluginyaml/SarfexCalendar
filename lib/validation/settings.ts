import { z } from "zod";

export const uiSettingsPayloadSchema = z.object({
  defaultView: z.enum(["day", "week", "month", "year"]),
  weekStartsOn: z.coerce.number().int().min(0).max(6),
  timezone: z.string().trim().min(1, "Die Zeitzone ist erforderlich."),
});

export type UiSettingsPayload = z.infer<typeof uiSettingsPayloadSchema>;
