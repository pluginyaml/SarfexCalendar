import "server-only";
import { invalidateCalDavTimeRangeCache } from "@/lib/cache/caldav-read-cache";
import {
  getCalendarSourceNameFallback,
  matchCalendarSourceHref,
  normalizeCalendarCollectionHref,
  normalizeCalendarCollectionUrl,
  normalizeCalendarItemHref,
} from "@/lib/calendar/source-utils";
import { discoverCalendarSources, type DiscoveredCalendarSource } from "@/lib/caldav/discovery";
import { prisma } from "@/lib/server/db/prisma";
import { readRuntimeEnv, requireRuntimeEnv } from "@/lib/server/env/runtime";
import { AppError } from "@/lib/server/errors";
import type { UpdateCalendarSourcesPayload } from "@/lib/validation/calendars";
import type { CalendarSourceRecord } from "@/types/entities";

type CalendarSourceRow = Awaited<ReturnType<typeof prisma.calendarSource.findFirstOrThrow>>;
type CalendarSourceDbClient = Pick<typeof prisma, "calendarSource">;

const calendarSourceOrderBy = [
  { sortOrder: "asc" as const },
  { displayName: "asc" as const },
];

function mapCalendarSource(calendarSource: CalendarSourceRow): CalendarSourceRecord {
  return {
    id: calendarSource.id,
    href: calendarSource.href,
    url: calendarSource.url,
    normalizedHref: calendarSource.normalizedHref,
    normalizedUrl: calendarSource.normalizedUrl,
    remoteName: calendarSource.remoteName,
    displayName: calendarSource.displayName,
    remoteColor: calendarSource.remoteColor,
    color: calendarSource.color,
    isActive: calendarSource.isActive,
    isDefault: calendarSource.isDefault,
    isMissingRemote: calendarSource.isMissingRemote,
    sortOrder: calendarSource.sortOrder,
    lastDiscoveredAt: calendarSource.lastDiscoveredAt?.toISOString() ?? null,
    lastSeenAt: calendarSource.lastSeenAt?.toISOString() ?? null,
    createdAt: calendarSource.createdAt.toISOString(),
    updatedAt: calendarSource.updatedAt.toISOString(),
  };
}

function buildFallbackCalendarSource() {
  const { CALDAV_CALENDAR_URL } = requireRuntimeEnv("CALDAV_CALENDAR_URL");
  const normalizedUrl = normalizeCalendarCollectionUrl(CALDAV_CALENDAR_URL);
  const normalizedHref = normalizeCalendarCollectionHref(new URL(CALDAV_CALENDAR_URL).pathname);
  const name = getCalendarSourceNameFallback(normalizedHref);

  return {
    href: normalizedHref,
    url: normalizedUrl,
    normalizedHref,
    normalizedUrl,
    remoteName: name,
    displayName: name,
    remoteColor: null,
    color: null,
  };
}

function sortSourcesForSelection<T extends { sortOrder: number; displayName: string }>(sources: T[]) {
  return [...sources].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.displayName.localeCompare(right.displayName, "de-DE"),
  );
}

async function createFallbackCalendarSourceIfNeeded(db: CalendarSourceDbClient) {
  const existingCount = await db.calendarSource.count();

  if (existingCount > 0) {
    return;
  }

  const fallbackSource = buildFallbackCalendarSource();

  await db.calendarSource.create({
    data: {
      ...fallbackSource,
      isActive: true,
      isDefault: true,
      isMissingRemote: false,
      sortOrder: 0,
      lastDiscoveredAt: null,
      lastSeenAt: null,
    },
  });
}

async function applyDiscoveryResults(
  db: CalendarSourceDbClient,
  discoveredSources: DiscoveredCalendarSource[],
) {
  const now = new Date();
  const existingSources = await db.calendarSource.findMany({
    orderBy: calendarSourceOrderBy,
  });
  const existingByHref = new Map(existingSources.map((source) => [source.normalizedHref, source]));
  const existingByUrl = new Map(existingSources.map((source) => [source.normalizedUrl, source]));
  const bootstrapCalendarUrl = readRuntimeEnv().CALDAV_CALENDAR_URL
    ? normalizeCalendarCollectionUrl(readRuntimeEnv().CALDAV_CALENDAR_URL!)
    : null;
  const isInitialBootstrap = existingSources.length === 0;
  const initialDefaultSource =
    discoveredSources.find(
      (source) => bootstrapCalendarUrl !== null && source.normalizedUrl === bootstrapCalendarUrl,
    ) ?? discoveredSources[0] ?? null;
  let maxSortOrder = existingSources.reduce(
    (currentMax, source) => Math.max(currentMax, source.sortOrder),
    -1,
  );
  const discoveredHrefs = new Set<string>();

  for (const source of discoveredSources) {
    discoveredHrefs.add(source.normalizedHref);
    const shouldBootstrapActivate =
      isInitialBootstrap && initialDefaultSource?.normalizedHref === source.normalizedHref;
    const existingSource =
      existingByHref.get(source.normalizedHref) ?? existingByUrl.get(source.normalizedUrl) ?? null;

    if (existingSource) {
      await db.calendarSource.update({
        where: {
          id: existingSource.id,
        },
        data: {
          href: source.href,
          url: source.url,
          normalizedHref: source.normalizedHref,
          normalizedUrl: source.normalizedUrl,
          remoteName: source.remoteName,
          remoteColor: source.remoteColor,
          isMissingRemote: false,
          lastDiscoveredAt: now,
          lastSeenAt: now,
        },
      });
      continue;
    }

    maxSortOrder += 1;

    await db.calendarSource.create({
      data: {
        href: source.href,
        url: source.url,
        normalizedHref: source.normalizedHref,
        normalizedUrl: source.normalizedUrl,
        remoteName: source.remoteName,
        displayName: source.displayName,
        remoteColor: source.remoteColor,
        color: source.remoteColor,
        isActive: shouldBootstrapActivate,
        isDefault: shouldBootstrapActivate,
        isMissingRemote: false,
        sortOrder: maxSortOrder,
        lastDiscoveredAt: now,
        lastSeenAt: now,
      },
    });
  }

  return {
    discoveredHrefs,
  };
}

async function markMissingCalendarSources(
  db: CalendarSourceDbClient,
  discoveredHrefs: Set<string>,
) {
  const currentSources = await db.calendarSource.findMany({
    orderBy: calendarSourceOrderBy,
  });
  const activeIds = new Set(
    currentSources.filter((source) => source.isActive).map((source) => source.id),
  );

  for (const source of currentSources) {
    const isDiscovered = discoveredHrefs.has(source.normalizedHref);

    if (isDiscovered) {
      if (source.isMissingRemote) {
        await db.calendarSource.update({
          where: {
            id: source.id,
          },
          data: {
            isMissingRemote: false,
          },
        });
      }

      continue;
    }

    const canDeactivate = !source.isActive || activeIds.size > 1;
    const nextIsActive = canDeactivate ? false : source.isActive;

    if (source.isActive && nextIsActive === false) {
      activeIds.delete(source.id);
    }

    if (source.isMissingRemote !== true || source.isActive !== nextIsActive) {
      await db.calendarSource.update({
        where: {
          id: source.id,
        },
        data: {
          isMissingRemote: true,
          isActive: nextIsActive,
        },
      });
    }
  }
}

function invalidateCalendarSourceCaches(sources: Array<Pick<CalendarSourceRecord, "normalizedHref">>) {
  for (const source of sources) {
    invalidateCalDavTimeRangeCache(source.normalizedHref);
  }
}

async function ensureCalendarSourceInvariants(db: CalendarSourceDbClient) {
  const allSources = await db.calendarSource.findMany({
    orderBy: calendarSourceOrderBy,
  });

  if (allSources.length === 0) {
    return [];
  }

  const activeSources = sortSourcesForSelection(allSources.filter((source) => source.isActive));

  if (activeSources.length === 0) {
    throw new AppError("Mindestens ein Kalender muss aktiv bleiben.", {
      code: "CALENDAR_SOURCE_ACTIVE_REQUIRED",
      statusCode: 422,
    });
  }

  const bootstrapCalendarUrl = readRuntimeEnv().CALDAV_CALENDAR_URL
    ? normalizeCalendarCollectionUrl(readRuntimeEnv().CALDAV_CALENDAR_URL!)
    : null;
  const activeVisibleSources =
    activeSources.filter((source) => !source.isMissingRemote).length > 0
      ? activeSources.filter((source) => !source.isMissingRemote)
      : activeSources;
  const defaultCandidate =
    activeVisibleSources.find((source) => source.isDefault) ??
    activeVisibleSources.find(
      (source) => bootstrapCalendarUrl !== null && source.normalizedUrl === bootstrapCalendarUrl,
    ) ??
    activeVisibleSources[0];

  for (const source of allSources) {
    const shouldBeDefault = source.id === defaultCandidate.id;

    if (source.isDefault !== shouldBeDefault) {
      await db.calendarSource.update({
        where: {
          id: source.id,
        },
        data: {
          isDefault: shouldBeDefault,
        },
      });
    }
  }

  return db.calendarSource.findMany({
    orderBy: calendarSourceOrderBy,
  });
}

export async function syncCalendarSources() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingSourceCount = await tx.calendarSource.count();
      const discoveredSources = await discoverCalendarSources();

      if (discoveredSources.length === 0) {
        if (existingSourceCount === 0) {
          await createFallbackCalendarSourceIfNeeded(tx);
        } else {
          await markMissingCalendarSources(tx, new Set<string>());
        }
      } else {
        const { discoveredHrefs } = await applyDiscoveryResults(tx, discoveredSources);
        await markMissingCalendarSources(tx, discoveredHrefs);
      }

      const normalizedSources = await ensureCalendarSourceInvariants(tx);
      return normalizedSources.map(mapCalendarSource);
    });

    invalidateCalendarSourceCaches(result);
    return result;
  } catch (error) {
    const existingSources = await prisma.calendarSource.findMany({
      orderBy: calendarSourceOrderBy,
    });

    if (existingSources.length > 0) {
      return existingSources.map(mapCalendarSource);
    }

    if (error instanceof AppError) {
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      await createFallbackCalendarSourceIfNeeded(tx);
      const fallbackSources = await ensureCalendarSourceInvariants(tx);
      return fallbackSources.map(mapCalendarSource);
    });
  }
}

export async function ensureCalendarSourcesInitialized() {
  const existingSources = await prisma.calendarSource.findMany({
    orderBy: calendarSourceOrderBy,
  });

  if (existingSources.length > 0) {
    return existingSources.map(mapCalendarSource);
  }

  return syncCalendarSources();
}

export async function listCalendarSources() {
  return ensureCalendarSourcesInitialized();
}

export async function listActiveCalendarSources(calendarIds?: string[]) {
  const allSources = await ensureCalendarSourcesInitialized();
  const activeSources = allSources.filter((source) => source.isActive && !source.isMissingRemote);

  if (!calendarIds || calendarIds.length === 0) {
    return activeSources;
  }

  const allowedIds = new Set(calendarIds);
  return activeSources.filter((source) => allowedIds.has(source.id));
}

export async function getCalendarSourceById(id: string) {
  const allSources = await ensureCalendarSourcesInitialized();
  const source = allSources.find((item) => item.id === id) ?? null;

  if (!source) {
    throw new AppError("Der angeforderte Kalender wurde nicht gefunden.", {
      code: "CALENDAR_SOURCE_NOT_FOUND",
      statusCode: 404,
    });
  }

  return source;
}

export async function getCalendarSourceForCreate(calendarId?: string | null) {
  const activeSources = await listActiveCalendarSources();

  if (activeSources.length === 0) {
    throw new AppError("Es ist kein aktiver Kalender verfügbar.", {
      code: "CALENDAR_SOURCE_NONE_ACTIVE",
      statusCode: 422,
    });
  }

  if (calendarId) {
    const matchingSource = activeSources.find((source) => source.id === calendarId) ?? null;

    if (!matchingSource) {
      throw new AppError("Der ausgewählte Kalender ist nicht aktiv.", {
        code: "CALENDAR_SOURCE_NOT_ACTIVE",
        statusCode: 422,
      });
    }

    return matchingSource;
  }

  if (activeSources.length === 1) {
    return activeSources[0];
  }

  return activeSources.find((source) => source.isDefault) ?? activeSources[0];
}

export async function findCalendarSourceForEventHref(href: string) {
  const allSources = await ensureCalendarSourcesInitialized();
  const normalizedEventHref = normalizeCalendarItemHref(href);
  const matchingSources = allSources
    .filter((source) => matchCalendarSourceHref(source.normalizedHref, normalizedEventHref))
    .sort((left, right) => right.normalizedHref.length - left.normalizedHref.length);

  return matchingSources[0] ?? null;
}

export async function updateCalendarSources(payload: UpdateCalendarSourcesPayload) {
  const knownSources = await ensureCalendarSourcesInitialized();
  const knownSourceIds = new Set(knownSources.map((source) => source.id));

  for (const source of payload.calendars) {
    if (!knownSourceIds.has(source.id)) {
      throw new AppError("Mindestens ein Kalender ist nicht mehr vorhanden.", {
        code: "CALENDAR_SOURCE_NOT_FOUND",
        statusCode: 404,
      });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const currentSources = await tx.calendarSource.findMany({
      orderBy: calendarSourceOrderBy,
    });
    const updatesById = new Map(payload.calendars.map((source) => [source.id, source]));
    const nextSources = currentSources.map((source) => {
      const update = updatesById.get(source.id);

      if (!update) {
        return source;
      }

      return {
        ...source,
        displayName: update.displayName.trim(),
        color: update.color,
        isActive: update.isActive,
        isDefault: update.isDefault,
        sortOrder: update.sortOrder,
      };
    });
    const activeSources = sortSourcesForSelection(nextSources.filter((source) => source.isActive));

    if (activeSources.length === 0) {
      throw new AppError("Mindestens ein Kalender muss aktiv bleiben.", {
        code: "CALENDAR_SOURCE_ACTIVE_REQUIRED",
        statusCode: 422,
      });
    }

    const defaultPool =
      activeSources.filter((source) => !source.isMissingRemote).length > 0
        ? activeSources.filter((source) => !source.isMissingRemote)
        : activeSources;
    const requestedDefault =
      defaultPool.find((source) => source.isDefault) ??
      currentSources.find(
        (source) => source.isDefault && defaultPool.some((item) => item.id === source.id),
      ) ??
      defaultPool[0];

    for (const source of nextSources) {
      await tx.calendarSource.update({
        where: {
          id: source.id,
        },
        data: {
          displayName: source.displayName,
          color: source.color,
          isActive: source.isActive,
          isDefault: source.id === requestedDefault.id,
          sortOrder: source.sortOrder,
        },
      });
    }

    const normalizedSources = await ensureCalendarSourceInvariants(tx);
    return normalizedSources.map(mapCalendarSource);
  });

  invalidateCalendarSourceCaches(result);
  return result;
}
