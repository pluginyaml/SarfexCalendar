import "server-only";
import bcrypt from "bcryptjs";
import { describeAuthString, logAuthDebug } from "@/lib/server/auth/debug";
import { requireRuntimeEnv } from "@/lib/server/env/runtime";
import { AppError } from "@/lib/server/errors";
import type { LoginInput } from "@/lib/validation/auth";

export async function authenticateAdmin({ email, password }: LoginInput) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, APP_SECRET } = requireRuntimeEnv(
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD_HASH",
    "APP_SECRET",
  );

  if (!APP_SECRET) {
    throw new AppError("APP_SECRET fehlt.", {
      code: "MISSING_APP_SECRET",
      statusCode: 500,
    });
  }

  const normalizedInputEmail = email.trim().toLowerCase();
  const normalizedAdminEmail = ADMIN_EMAIL.trim().toLowerCase();
  const passwordDiffersWhenTrimmed = password !== password.trim();

  logAuthDebug("authenticateAdmin.env", {
    normalizedAdminEmail,
    adminEmail: describeAuthString(ADMIN_EMAIL),
    adminPasswordHash: describeAuthString(ADMIN_PASSWORD_HASH),
    appSecret: describeAuthString(APP_SECRET),
  });

  logAuthDebug("authenticateAdmin.input", {
    normalizedInputEmail,
    email: describeAuthString(email),
    password: describeAuthString(password),
    passwordDiffersWhenTrimmed,
  });

  if (normalizedInputEmail !== normalizedAdminEmail) {
    logAuthDebug("authenticateAdmin.email-mismatch", {
      normalizedInputEmail,
      normalizedAdminEmail,
    });
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  logAuthDebug("authenticateAdmin.password-compare", {
    normalizedInputEmail,
    isPasswordValid,
    trimmedPasswordWouldMatch:
      passwordDiffersWhenTrimmed
        ? await bcrypt.compare(password.trim(), ADMIN_PASSWORD_HASH)
        : false,
  });

  if (!isPasswordValid) {
    return null;
  }

  return {
    email: ADMIN_EMAIL,
  };
}
