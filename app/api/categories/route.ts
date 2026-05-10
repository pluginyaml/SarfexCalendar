import { type NextRequest } from "next/server";
import { createCategory, listCategories } from "@/lib/server/db/categories";
import { requireApiSession } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { categoryPayloadSchema } from "@/lib/validation/categories";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    requireApiSession(request);
    return jsonSuccess(await listCategories());
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireApiSession(request);
    const payload = categoryPayloadSchema.parse(await request.json());
    return jsonSuccess(await createCategory(payload), { status: 201 });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
