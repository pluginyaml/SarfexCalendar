import "server-only";
import bcrypt from "bcryptjs";
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

  if (normalizedInputEmail !== normalizedAdminEmail) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

  if (!isPasswordValid) {
    return null;
  }

  return {
    email: ADMIN_EMAIL,
  };
}
