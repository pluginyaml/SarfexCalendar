import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gueltige E-Mail-Adresse ein."),
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

export type LoginInput = z.infer<typeof loginSchema>;
