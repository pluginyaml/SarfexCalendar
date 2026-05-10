import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db/prisma";
import type { EventTemplatePayload } from "@/lib/validation/templates";
import { normalizeReminderMinutes } from "@/lib/reminders";
import type { EventTemplateRecord } from "@/types/entities";

type EventTemplateWithRelations = Prisma.EventTemplateGetPayload<{
  include: {
    category: true;
    locationTemplate: true;
  };
}>;

function mapEventTemplate(template: EventTemplateWithRelations): EventTemplateRecord {
  return {
    id: template.id,
    name: template.name,
    titleTemplate: template.titleTemplate,
    categoryId: template.categoryId,
    categoryName: template.category.name,
    locationTemplateId: template.locationTemplateId,
    locationTemplateName: template.locationTemplate?.name ?? null,
    defaultDurationMinutes: template.defaultDurationMinutes,
    defaultDescription: template.defaultDescription,
    defaultReminderMinutes: normalizeReminderMinutes(template.defaultReminderMinutes),
    isAllDayDefault: template.isAllDayDefault,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

const includeRelations = {
  category: true,
  locationTemplate: true,
} satisfies Prisma.EventTemplateInclude;

export async function listEventTemplates() {
  const templates = await prisma.eventTemplate.findMany({
    include: includeRelations,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return templates.map(mapEventTemplate);
}

export async function getEventTemplateById(id: string) {
  const template = await prisma.eventTemplate.findUniqueOrThrow({
    where: { id },
    include: includeRelations,
  });

  return mapEventTemplate(template);
}

export async function createEventTemplate(data: EventTemplatePayload) {
  const template = await prisma.eventTemplate.create({
    data,
    include: includeRelations,
  });

  return mapEventTemplate(template);
}

export async function updateEventTemplate(id: string, data: EventTemplatePayload) {
  const template = await prisma.eventTemplate.update({
    where: { id },
    data,
    include: includeRelations,
  });

  return mapEventTemplate(template);
}

export async function deleteEventTemplate(id: string) {
  await prisma.eventTemplate.delete({
    where: { id },
  });
}
