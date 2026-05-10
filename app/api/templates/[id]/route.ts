import { type NextRequest } from "next/server";
import {
  deleteEventTemplate,
  getEventTemplateById,
  updateEventTemplate,
} from "@/lib/server/db/templates";
import { requireApiSession } from "@/lib/server/auth/session";
import { createJsonErrorResponse, jsonSuccess } from "@/lib/server/http";
import { eventTemplatePayloadSchema } from "@/lib/validation/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TemplateRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: TemplateRouteContext) {
  try {
    requireApiSession(request);
    const { id } = await context.params;
    return jsonSuccess(await getEventTemplateById(id));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: TemplateRouteContext) {
  try {
    requireApiSession(request);
    const payload = eventTemplatePayloadSchema.parse(await request.json());
    const { id } = await context.params;
    return jsonSuccess(await updateEventTemplate(id, payload));
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: TemplateRouteContext) {
  try {
    requireApiSession(request);
    const { id } = await context.params;
    await deleteEventTemplate(id);
    return jsonSuccess({ id });
  } catch (error) {
    return createJsonErrorResponse(error);
  }
}
