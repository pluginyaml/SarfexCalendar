import { type NextRequest } from "next/server";
import {
  deleteLocationTemplate,
  getLocationTemplateById,
  updateLocationTemplate,
} from "@/lib/server/db/locations";
import { requireApiSession } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { locationTemplatePayloadSchema } from "@/lib/validation/locations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LocationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: LocationRouteContext) {
  try {
    requireApiSession(request);
    const { id } = await context.params;
    return jsonSuccess(await getLocationTemplateById(id));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: LocationRouteContext) {
  try {
    requireApiSession(request);
    const payload = locationTemplatePayloadSchema.parse(await request.json());
    const { id } = await context.params;
    return jsonSuccess(await updateLocationTemplate(id, payload));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: LocationRouteContext) {
  try {
    requireApiSession(request);
    const { id } = await context.params;
    await deleteLocationTemplate(id);
    return jsonSuccess({ id });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
