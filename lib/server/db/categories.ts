import "server-only";
import type { Category } from "@prisma/client";
import { prisma } from "@/lib/server/db/prisma";
import type { CategoryPayload } from "@/lib/validation/categories";
import { normalizeReminderMinutes } from "@/lib/reminders";
import type { CategoryRecord } from "@/types/entities";

function mapCategory(category: Category): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    defaultDurationMinutes: category.defaultDurationMinutes,
    defaultReminderMinutes: normalizeReminderMinutes(category.defaultReminderMinutes),
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map(mapCategory);
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id },
  });

  return mapCategory(category);
}

export async function createCategory(data: CategoryPayload) {
  const category = await prisma.category.create({
    data,
  });

  return mapCategory(category);
}

export async function updateCategory(id: string, data: CategoryPayload) {
  const category = await prisma.category.update({
    where: { id },
    data,
  });

  return mapCategory(category);
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({
    where: { id },
  });
}
