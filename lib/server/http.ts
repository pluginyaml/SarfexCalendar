import { Prisma } from "@prisma/client";
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
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return jsonError("Die Datenbank ist nicht erreichbar.", {
      status: 500,
      code: "DATABASE_UNAVAILABLE",
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonError("Ein Eintrag mit diesen Werten existiert bereits.", {
        status: 409,
        code: error.code,
      });
    }

    if (error.code === "P2003") {
      return jsonError(
        "Dieser Eintrag kann nicht geloescht oder geaendert werden, weil noch Verknuepfungen bestehen.",
        {
          status: 409,
          code: error.code,
        },
      );
    }

    if (error.code === "P2025") {
      return jsonError("Der angeforderte Eintrag wurde nicht gefunden.", {
        status: 404,
        code: error.code,
      });
    }

    if (error.code === "P2021") {
      return jsonError(
        "Das Datenbankschema ist noch nicht bereit. Bitte fuehre die Migrationen aus.",
        {
          status: 500,
          code: error.code,
        },
      );
    }
  }

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
