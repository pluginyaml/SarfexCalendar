import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { describeAuthString, logAuthDebug } from "@/lib/server/auth/debug";
import { readRuntimeEnv, requireRuntimeEnv } from "@/lib/server/env/runtime";
import { AppError } from "@/lib/server/errors";

const sessionPayloadSchema = z.object({
  email: z.string().email(),
  exp: z.number().int().positive(),
});

export type AdminSession = {
  email: string;
  expiresAt: number;
};

export const SESSION_COOKIE_NAME = "sarfex_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(email: string) {
  const { APP_SECRET } = requireRuntimeEnv("APP_SECRET");
  const payload = {
    email,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload, APP_SECRET);

  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token?: string | null): AdminSession | null {
  if (!token) {
    return null;
  }

  const { APP_SECRET } = readRuntimeEnv();

  if (!APP_SECRET) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, APP_SECRET);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }

  try {
    const parsed = sessionPayloadSchema.parse(
      JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")),
    );

    if (parsed.exp <= Date.now()) {
      return null;
    }

    return {
      email: parsed.email,
      expiresAt: parsed.exp,
    };
  } catch {
    return null;
  }
}

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function getSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function requirePageSession() {
  const session = await getSessionFromCookies();

  if (!session) {
    logAuthDebug("requirePageSession.redirect", {
      reason: "missing-or-invalid-session",
    });
    redirect("/login");
  }

  return session;
}

export function requireApiSession(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    logAuthDebug("requireApiSession.unauthorized", {
      pathname: request.nextUrl.pathname,
      hasCookie: Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value),
      cookie: describeAuthString(request.cookies.get(SESSION_COOKIE_NAME)?.value),
    });
    throw new AppError("Nicht eingeloggt.", {
      code: "UNAUTHORIZED",
      statusCode: 401,
    });
  }

  return session;
}

export function attachSessionCookie(response: NextResponse, email: string) {
  const cookieOptions = {
    name: SESSION_COOKIE_NAME,
    value: createSessionToken(email),
    ...getSessionCookieOptions(),
  };

  logAuthDebug("attachSessionCookie", {
    email,
    cookieName: cookieOptions.name,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge,
    cookieValue: describeAuthString(cookieOptions.value),
  });

  response.cookies.set(cookieOptions);

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}
