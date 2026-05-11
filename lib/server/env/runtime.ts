import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
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
type RequiredRuntimeEnv<Keys extends RuntimeEnvKey> = {
  [Key in Keys]-?: NonNullable<RuntimeEnv[Key]>;
};

function refreshDevelopmentEnv() {
  const nodeEnv = String(process.env["NODE_ENV"] ?? "");

  if (nodeEnv === "production") {
    return;
  }

  loadEnvConfig(
    /* turbopackIgnore: true */ process.cwd(),
    nodeEnv !== "production",
    {
      info: () => {},
      error: (...args: unknown[]) => {
        console.error("[env-debug] loadEnvConfig error", ...args);
      },
    },
    true,
  );
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function readRawLocalEnvValue(key: string) {
  const nodeEnv = String(process.env["NODE_ENV"] ?? "development");
  const envFileCandidates = [
    `.env.${nodeEnv}.local`,
    nodeEnv === "test" ? null : ".env.local",
    `.env.${nodeEnv}`,
    ".env",
  ].filter((value): value is string => Boolean(value));

  for (const envFileName of envFileCandidates) {
    const envPath = join(/* turbopackIgnore: true */ process.cwd(), envFileName);

    if (!existsSync(envPath)) {
      continue;
    }

    const fileContents = readFileSync(envPath, "utf8");
    const line = fileContents
      .split(/\r?\n/)
      .find((currentLine) => currentLine.startsWith(`${key}=`));

    if (!line) {
      continue;
    }

    return stripWrappingQuotes(line.slice(key.length + 1));
  }

  return undefined;
}

function getSafeAdminPasswordHash() {
  const currentValue = process.env.ADMIN_PASSWORD_HASH;

  if (
    typeof currentValue === "string" &&
    currentValue.length >= 60 &&
    currentValue.startsWith("$2")
  ) {
    return currentValue;
  }

  const rawFileValue = readRawLocalEnvValue("ADMIN_PASSWORD_HASH");

  if (
    typeof rawFileValue === "string" &&
    rawFileValue.length >= 60 &&
    rawFileValue.startsWith("$2")
  ) {
    if (
      process.env["NODE_ENV"] !== "production" &&
      currentValue !== rawFileValue
    ) {
      console.info(
        "[env-debug] using raw ADMIN_PASSWORD_HASH from .env because the expanded runtime value looks truncated",
      );
    }

    return rawFileValue;
  }

  return currentValue;
}

function getSafeAppSecret() {
  const currentValue = process.env.APP_SECRET;
  const rawFileValue = readRawLocalEnvValue("APP_SECRET");

  if (
    typeof rawFileValue === "string" &&
    rawFileValue.length >= 32 &&
    rawFileValue.includes("$") &&
    rawFileValue !== currentValue
  ) {
    if (process.env["NODE_ENV"] !== "production") {
      console.info(
        "[env-debug] using raw APP_SECRET from local env file because the expanded runtime value differs",
      );
    }

    return rawFileValue;
  }

  return currentValue;
}

export function readRuntimeEnv(): RuntimeEnv {
  refreshDevelopmentEnv();

  return runtimeEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    APP_SECRET: getSafeAppSecret(),
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: getSafeAdminPasswordHash(),
    CALDAV_BASE_URL: process.env.CALDAV_BASE_URL,
    CALDAV_CALENDAR_URL: process.env.CALDAV_CALENDAR_URL,
    CALDAV_USERNAME: process.env.CALDAV_USERNAME,
    CALDAV_PASSWORD: process.env.CALDAV_PASSWORD,
    TIMEZONE: process.env.TIMEZONE,
  });
}

export function requireRuntimeEnv<const Keys extends RuntimeEnvKey[]>(
  ...keys: Keys
): RequiredRuntimeEnv<Keys[number]> {
  const env = readRuntimeEnv();
  const missing = keys.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new EnvValidationError(
      `Fehlende Runtime-ENV: ${missing.join(", ")}.`,
      missing,
    );
  }

  return Object.fromEntries(keys.map((key) => [key, env[key]])) as RequiredRuntimeEnv<
    Keys[number]
  >;
}
