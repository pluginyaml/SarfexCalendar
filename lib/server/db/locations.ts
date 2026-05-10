import "server-only";
import type { LocationTemplate } from "@prisma/client";
import { prisma } from "@/lib/server/db/prisma";
import type { LocationTemplatePayload } from "@/lib/validation/locations";
import type { LocationTemplateRecord } from "@/types/entities";

function mapLocationTemplate(locationTemplate: LocationTemplate): LocationTemplateRecord {
  return {
    id: locationTemplate.id,
    name: locationTemplate.name,
    address: locationTemplate.address,
    link: locationTemplate.link,
    notes: locationTemplate.notes,
    defaultDescription: locationTemplate.defaultDescription,
    isActive: locationTemplate.isActive,
    createdAt: locationTemplate.createdAt.toISOString(),
    updatedAt: locationTemplate.updatedAt.toISOString(),
  };
}

export async function listLocationTemplates() {
  const templates = await prisma.locationTemplate.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return templates.map(mapLocationTemplate);
}

export async function getLocationTemplateById(id: string) {
  const template = await prisma.locationTemplate.findUniqueOrThrow({
    where: { id },
  });

  return mapLocationTemplate(template);
}

export async function createLocationTemplate(data: LocationTemplatePayload) {
  const template = await prisma.locationTemplate.create({
    data,
  });

  return mapLocationTemplate(template);
}

export async function updateLocationTemplate(id: string, data: LocationTemplatePayload) {
  const template = await prisma.locationTemplate.update({
    where: { id },
    data,
  });

  return mapLocationTemplate(template);
}

export async function deleteLocationTemplate(id: string) {
  await prisma.locationTemplate.delete({
    where: { id },
  });
}
