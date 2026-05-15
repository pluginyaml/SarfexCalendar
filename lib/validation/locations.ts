import { z } from "zod";

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const locationTemplatePayloadSchema = z.object({
  name: z.string().trim().min(1, "Der Name ist erforderlich."),
  address: z.string().trim().min(1, "Die Adresse ist erforderlich."),
  link: z.preprocess(emptyStringToNull, z.string().url("Bitte gib eine gültige URL ein.").nullable()),
  notes: z.preprocess(emptyStringToNull, z.string().max(2000).nullable()),
  defaultDescription: z.preprocess(emptyStringToNull, z.string().max(4000).nullable()),
  isActive: z.boolean(),
});

export type LocationTemplatePayload = z.infer<typeof locationTemplatePayloadSchema>;
