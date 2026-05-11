import { type NextRequest, NextResponse } from "next/server";
import { describeAuthString, logAuthDebug } from "@/lib/server/auth/debug";
import { authenticateAdmin } from "@/lib/server/auth/admin";
import { attachSessionCookie } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonError } from "@/lib/server/http";
import { loginSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const parsedBody = JSON.parse(rawBody) as unknown;
    const input = loginSchema.parse(parsedBody);

    logAuthDebug("loginRoute.request", {
      method: request.method,
      pathname: request.nextUrl.pathname,
      contentType: request.headers.get("content-type"),
      rawBodyLength: rawBody.length,
      bodyKeys:
        parsedBody && typeof parsedBody === "object" ? Object.keys(parsedBody as object) : [],
      normalizedInputEmail: input.email.trim().toLowerCase(),
      email: describeAuthString(input.email),
      password: describeAuthString(input.password),
    });

    const session = await authenticateAdmin(input);

    if (!session) {
      logAuthDebug("loginRoute.invalid-credentials", {
        normalizedInputEmail: input.email.trim().toLowerCase(),
      });

      return jsonError("Ungueltige Anmeldedaten.", {
        status: 401,
        code: "INVALID_CREDENTIALS",
      });
    }

    logAuthDebug("loginRoute.authenticated", {
      normalizedInputEmail: input.email.trim().toLowerCase(),
    });

    const response = NextResponse.json({
      ok: true,
      data: {
        email: session.email,
      },
    });

    return attachSessionCookie(response, session.email);
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
