import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server/auth/session";
import { createJsonErrorResponse } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const response = NextResponse.json({
      ok: true,
    });

    return clearSessionCookie(response);
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
