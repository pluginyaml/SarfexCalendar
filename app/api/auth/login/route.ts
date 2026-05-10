import { type NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/server/auth/admin";
import { attachSessionCookie } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonError } from "@/lib/server/http";
import { loginSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json());
    const session = await authenticateAdmin(input);

    if (!session) {
      return jsonError("Ungueltige Anmeldedaten.", {
        status: 401,
        code: "INVALID_CREDENTIALS",
      });
    }

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
