import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "@/lib/server/errors";

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    init,
  );
}

export function jsonError(
  message: string,
  init?: ResponseInit & {
    code?: string;
    details?: unknown;
  },
) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      code: init?.code,
      details: init?.details,
    },
    init,
  );
}

export function createJsonErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Die Anfrage ist ungueltig.", {
      status: 422,
      code: "VALIDATION_ERROR",
      details: error.flatten(),
    });
  }

  if (isAppError(error)) {
    return jsonError(error.message, {
      status: error.statusCode,
      code: error.code,
      details: error.details,
    });
  }

  console.error(error);
  return jsonError("Unerwarteter Serverfehler.", {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
  });
}
