import "server-only";
import { z } from "zod";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import { EnvValidationError } from "@/lib/server/errors";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const runtimeEnvSchema = z.object({
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  APP_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  APP_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  ADMIN_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  ADMIN_PASSWORD_HASH: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CALDAV_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  CALDAV_CALENDAR_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  CALDAV_USERNAME: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CALDAV_PASSWORD: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  TIMEZONE: z.preprocess(emptyToUndefined, z.string().min(1).default(DEFAULT_TIMEZONE)),
});

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;
export type RuntimeEnvKey = keyof RuntimeEnv;

export function readRuntimeEnv(): RuntimeEnv {
  return runtimeEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    APP_SECRET: process.env.APP_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    CALDAV_BASE_URL: process.env.CALDAV_BASE_URL,
    CALDAV_CALENDAR_URL: process.env.CALDAV_CALENDAR_URL,
    CALDAV_USERNAME: process.env.CALDAV_USERNAME,
    CALDAV_PASSWORD: process.env.CALDAV_PASSWORD,
    TIMEZONE: process.env.TIMEZONE,
  });
}

export function requireRuntimeEnv<const Keys extends RuntimeEnvKey[]>(
  ...keys: Keys
): Pick<RuntimeEnv, Keys[number]> {
  const env = readRuntimeEnv();
  const missing = keys.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new EnvValidationError(
      `Fehlende Runtime-ENV: ${missing.join(", ")}.`,
      missing,
    );
  }

  return Object.fromEntries(keys.map((key) => [key, env[key]])) as Pick<
    RuntimeEnv,
    Keys[number]
  >;
}
