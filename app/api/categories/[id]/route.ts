import { type NextRequest } from "next/server";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/lib/server/db/categories";
import { requireApiSession } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { categoryPayloadSchema } from "@/lib/validation/categories";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CategoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: CategoryRouteContext) {
  try {
    requireApiSession(request);
    const { id } = await context.params;
    return jsonSuccess(await getCategoryById(id));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: CategoryRouteContext) {
  try {
    requireApiSession(request);
    const payload = categoryPayloadSchema.parse(await request.json());
    const { id } = await context.params;
    return jsonSuccess(await updateCategory(id, payload));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: CategoryRouteContext) {
  try {
    requireApiSession(request);
    const { id } = await context.params;
    await deleteCategory(id);
    return jsonSuccess({ id });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
