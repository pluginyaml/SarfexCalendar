import "server-only";
import type { UiSettings } from "@prisma/client";
import { DEFAULT_TIMEZONE, DEFAULT_WEEK_STARTS_ON } from "@/lib/constants";
import { prisma } from "@/lib/server/db/prisma";
import type { UiSettingsPayload } from "@/lib/validation/settings";
import type { UiSettingsRecord } from "@/types/entities";

function mapUiSettings(settings: UiSettings): UiSettingsRecord {
  return {
    id: settings.id,
    defaultView: settings.defaultView as UiSettingsRecord["defaultView"],
    weekStartsOn: settings.weekStartsOn,
    timezone: settings.timezone,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

async function getOrCreateUiSettingsRow() {
  const existingSettings = await prisma.uiSettings.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingSettings) {
    return existingSettings;
  }

  return prisma.uiSettings.create({
    data: {
      defaultView: "week",
      weekStartsOn: DEFAULT_WEEK_STARTS_ON,
      timezone: DEFAULT_TIMEZONE,
    },
  });
}

export async function getUiSettings() {
  return mapUiSettings(await getOrCreateUiSettingsRow());
}

export async function updateUiSettings(data: UiSettingsPayload) {
  const existingSettings = await getOrCreateUiSettingsRow();
  const updatedSettings = await prisma.uiSettings.update({
    where: {
      id: existingSettings.id,
    },
    data,
  });

  return mapUiSettings(updatedSettings);
}
