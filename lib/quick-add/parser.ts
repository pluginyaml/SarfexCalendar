import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { applyDurationToLocalDateTime } from "@/lib/event-time";
import { remindersToInputString } from "@/lib/reminders";
import type {
  CalendarSourceRecord,
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";
import type { QuickAddDraft, QuickAddParseResult, QuickAddParserContext } from "@/lib/quick-add/types";

type QuickAddToken = {
  raw: string;
  normalized: string;
  index: number;
};

type EntityMatchType = "category" | "location" | "template" | "calendar";

type EntityMatch<T> = {
  entity: T;
  type: EntityMatchType;
  start: number;
  end: number;
  length: number;
};

type DateContext = {
  timezone: string;
  todayKey: string;
  todayAnchor: Date;
  currentYear: number;
  currentWeekday: number;
};

type ParsedDateExpression = {
  dateKey: string;
  start: number;
  end: number;
};

type ParsedDateInfo = {
  startDate: string;
  endDate?: string;
  consumedIndexes: Set<number>;
};

type ParsedTimeInfo = {
  time: string;
  consumedIndexes: Set<number>;
};

type ParsedDurationInfo = {
  minutes: number;
  consumedIndexes: Set<number>;
};

const RELATIVE_DATE_OFFSETS: Record<string, number> = {
  heute: 0,
  morgen: 1,
  uebermorgen: 2,
};

const WEEKDAY_INDEX: Record<string, number> = {
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
  sonntag: 7,
};

const ALL_DAY_KEYWORDS = new Set(["ganztagig", "ganztaegig", "ganztags"]);

const ENTITY_MATCH_PRIORITY: Record<EntityMatchType, number> = {
  template: 4,
  location: 3,
  calendar: 2,
  category: 1,
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\u00e4/g, "ae")
    .replace(/\u00f6/g, "oe")
    .replace(/\u00fc/g, "ue")
    .replace(/\u00df/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.:/+-]+/g, " ")
    .trim();
}

function tokenizeQuickAddInput(input: string) {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((raw, index) => ({
      raw,
      normalized: normalizeText(raw),
      index,
    }));
}

function buildDateContext(now: Date, timezone: string): DateContext {
  const todayKey = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const todayAnchor = fromZonedTime(`${todayKey}T12:00:00`, timezone);

  return {
    timezone,
    todayKey,
    todayAnchor,
    currentYear: Number(formatInTimeZone(todayAnchor, timezone, "yyyy")),
    currentWeekday: Number(formatInTimeZone(todayAnchor, timezone, "i")),
  };
}

function isValidCalendarDate(year: number, month: number, day: number) {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${padDatePart(month)}-${padDatePart(day)}`;
}

function resolveRelativeDate(offset: number, context: DateContext) {
  return formatInTimeZone(addDays(context.todayAnchor, offset), context.timezone, "yyyy-MM-dd");
}

function resolveWeekdayDate(
  weekday: number,
  context: DateContext,
  options?: {
    weekOffset?: number;
  },
) {
  let delta = weekday - context.currentWeekday;

  if (delta < 0) {
    delta += 7;
  }

  delta += (options?.weekOffset ?? 0) * 7;

  return formatInTimeZone(addDays(context.todayAnchor, delta), context.timezone, "yyyy-MM-dd");
}

function parseExplicitDateToken(
  token: string,
  context: DateContext,
  referenceDateKey?: string,
) {
  const match = token.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = match[3];
  const resolvedReferenceYear = referenceDateKey ? Number(referenceDateKey.slice(0, 4)) : null;

  let year = rawYear
    ? rawYear.length === 2
      ? 2000 + Number(rawYear)
      : Number(rawYear)
    : resolvedReferenceYear ?? context.currentYear;

  if (!isValidCalendarDate(year, month, day)) {
    return null;
  }

  let dateKey = toDateKey(year, month, day);

  if (!rawYear && !referenceDateKey && dateKey < context.todayKey) {
    year += 1;
    dateKey = toDateKey(year, month, day);
  }

  if (!rawYear && referenceDateKey && dateKey < referenceDateKey) {
    year += 1;

    if (!isValidCalendarDate(year, month, day)) {
      return null;
    }

    dateKey = toDateKey(year, month, day);
  }

  return dateKey;
}

function parseDateExpressionAt(
  tokens: QuickAddToken[],
  startIndex: number,
  context: DateContext,
  referenceDateKey?: string,
): ParsedDateExpression | null {
  const token = tokens[startIndex];

  if (!token) {
    return null;
  }

  if (token.normalized === "naechste" && tokens[startIndex + 1]?.normalized === "woche") {
    const weekdayToken = tokens[startIndex + 2];

    if (weekdayToken && weekdayToken.normalized in WEEKDAY_INDEX) {
      return {
        dateKey: resolveWeekdayDate(WEEKDAY_INDEX[weekdayToken.normalized], context, {
          weekOffset: 1,
        }),
        start: startIndex,
        end: startIndex + 2,
      };
    }
  }

  if (token.normalized in RELATIVE_DATE_OFFSETS) {
    return {
      dateKey: resolveRelativeDate(RELATIVE_DATE_OFFSETS[token.normalized], context),
      start: startIndex,
      end: startIndex,
    };
  }

  if (token.normalized in WEEKDAY_INDEX) {
    return {
      dateKey: resolveWeekdayDate(WEEKDAY_INDEX[token.normalized], context),
      start: startIndex,
      end: startIndex,
    };
  }

  const explicitDate = parseExplicitDateToken(token.normalized, context, referenceDateKey);

  if (!explicitDate) {
    return null;
  }

  return {
    dateKey: explicitDate,
    start: startIndex,
    end: startIndex,
  };
}

function collectIndexes(start: number, end: number) {
  const indexes = new Set<number>();

  for (let index = start; index <= end; index += 1) {
    indexes.add(index);
  }

  return indexes;
}

function parseDateInfo(tokens: QuickAddToken[], context: DateContext): ParsedDateInfo | null {
  for (let index = 0; index < tokens.length; index += 1) {
    const startExpression = parseDateExpressionAt(tokens, index, context);

    if (!startExpression) {
      continue;
    }

    const separatorIndex = startExpression.end + 1;
    const maybeSeparator = tokens[separatorIndex];

    if (maybeSeparator?.normalized === "bis") {
      const endExpression = parseDateExpressionAt(
        tokens,
        separatorIndex + 1,
        context,
        startExpression.dateKey,
      );

      if (endExpression) {
        return {
          startDate: startExpression.dateKey,
          endDate: endExpression.dateKey,
          consumedIndexes: collectIndexes(startExpression.start, endExpression.end),
        };
      }
    }

    return {
      startDate: startExpression.dateKey,
      consumedIndexes: collectIndexes(startExpression.start, startExpression.end),
    };
  }

  return null;
}

function formatTimeValue(hour: number, minute: number) {
  return `${padDatePart(hour)}:${padDatePart(minute)}`;
}

function tryBuildTimeValue(hour: number, minute: number) {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return formatTimeValue(hour, minute);
}

function parseTimeInfo(tokens: QuickAddToken[]): ParsedTimeInfo | null {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const directMatch = token.normalized.match(/^(\d{1,2}):(\d{2})$/);

    if (directMatch) {
      const time = tryBuildTimeValue(Number(directMatch[1]), Number(directMatch[2]));

      if (time) {
        return {
          time,
          consumedIndexes: new Set([index]),
        };
      }
    }

    const suffixMatch = token.normalized.match(/^(\d{1,2})uhr$/);

    if (suffixMatch) {
      const time = tryBuildTimeValue(Number(suffixMatch[1]), 0);

      if (time) {
        return {
          time,
          consumedIndexes: new Set([index]),
        };
      }
    }

    const nextToken = tokens[index + 1];

    if (/^\d{1,2}$/.test(token.normalized) && nextToken?.normalized === "uhr") {
      const time = tryBuildTimeValue(Number(token.normalized), 0);

      if (time) {
        return {
          time,
          consumedIndexes: new Set([index, index + 1]),
        };
      }
    }
  }

  return null;
}

function parseDurationUnit(value: number, unit: string) {
  if (["h", "std", "stunde", "stunden"].includes(unit)) {
    return value * 60;
  }

  if (["min", "minute", "minuten"].includes(unit)) {
    return value;
  }

  return null;
}

function parseDurationInfo(tokens: QuickAddToken[]): ParsedDurationInfo | null {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const combinedMatch = token.normalized.match(/^(\d+)(h|std|min)$/);

    if (combinedMatch) {
      const minutes = parseDurationUnit(Number(combinedMatch[1]), combinedMatch[2]);

      if (minutes) {
        return {
          minutes,
          consumedIndexes: new Set([index]),
        };
      }
    }

    const nextToken = tokens[index + 1];

    if (!/^\d+$/.test(token.normalized) || !nextToken) {
      continue;
    }

    const minutes = parseDurationUnit(Number(token.normalized), nextToken.normalized);

    if (minutes) {
      return {
        minutes,
        consumedIndexes: new Set([index, index + 1]),
      };
    }
  }

  return null;
}

function collectAllDayIndexes(tokens: QuickAddToken[]) {
  const indexes = new Set<number>();

  for (const token of tokens) {
    if (ALL_DAY_KEYWORDS.has(token.normalized)) {
      indexes.add(token.index);
    }
  }

  return indexes;
}

function candidateNameTokens(name: string) {
  return normalizeText(name)
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function findEntityMatches<T extends { name: string }>(
  tokens: QuickAddToken[],
  entities: T[],
  type: EntityMatchType,
) {
  const matches: Array<EntityMatch<T>> = [];

  for (const entity of entities) {
    const normalizedNameTokens = candidateNameTokens(entity.name);

    if (normalizedNameTokens.length === 0) {
      continue;
    }

    for (let startIndex = 0; startIndex <= tokens.length - normalizedNameTokens.length; startIndex += 1) {
      const slice = tokens.slice(startIndex, startIndex + normalizedNameTokens.length);

      if (slice.every((token, index) => token.normalized === normalizedNameTokens[index])) {
        matches.push({
          entity,
          type,
          start: startIndex,
          end: startIndex + normalizedNameTokens.length - 1,
          length: normalizedNameTokens.length,
        });
      }
    }
  }

  return matches;
}

function selectEntityMatches(context: QuickAddParserContext, tokens: QuickAddToken[]) {
  const templateMatches = findEntityMatches(
    tokens,
    context.templates
      .filter((template) => template.isActive)
      .map((template) => ({
        ...template,
        name: template.name,
      })),
    "template",
  );
  const locationMatches = findEntityMatches(
    tokens,
    context.locations
      .filter((location) => location.isActive)
      .map((location) => ({
        ...location,
        name: location.name,
      })),
    "location",
  );
  const calendarMatches = findEntityMatches(
    tokens,
    context.calendars
      .filter((calendar) => calendar.isActive)
      .map((calendar) => ({
        ...calendar,
        name: calendar.displayName,
      })),
    "calendar",
  );
  const categoryMatches = findEntityMatches(
    tokens,
    context.categories
      .filter((category) => category.isActive)
      .map((category) => ({
        ...category,
        name: category.name,
      })),
    "category",
  );

  const allMatches = [
    ...templateMatches,
    ...locationMatches,
    ...calendarMatches,
    ...categoryMatches,
  ].sort((left, right) => {
    if (right.length !== left.length) {
      return right.length - left.length;
    }

    if (ENTITY_MATCH_PRIORITY[right.type] !== ENTITY_MATCH_PRIORITY[left.type]) {
      return ENTITY_MATCH_PRIORITY[right.type] - ENTITY_MATCH_PRIORITY[left.type];
    }

    return left.start - right.start;
  });

  const occupiedIndexes = new Set<number>();
  const selectedByType = new Map<EntityMatchType, EntityMatch<unknown>>();

  for (const match of allMatches) {
    if (selectedByType.has(match.type)) {
      continue;
    }

    const hasOverlap = Array.from({ length: match.length }, (_, offset) => match.start + offset).some(
      (index) => occupiedIndexes.has(index),
    );

    if (hasOverlap) {
      continue;
    }

    selectedByType.set(match.type, match);

    for (let index = match.start; index <= match.end; index += 1) {
      occupiedIndexes.add(index);
    }
  }

  return {
    template: selectedByType.get("template") as EntityMatch<EventTemplateRecord> | undefined,
    location: selectedByType.get("location") as EntityMatch<LocationTemplateRecord> | undefined,
    calendar: selectedByType.get("calendar") as EntityMatch<CalendarSourceRecord> | undefined,
    category: selectedByType.get("category") as EntityMatch<CategoryRecord> | undefined,
  };
}

function addMatchIndexes(indexes: Set<number>, match?: EntityMatch<unknown>) {
  if (!match) {
    return;
  }

  for (let index = match.start; index <= match.end; index += 1) {
    indexes.add(index);
  }
}

function buildRemainingTitle(tokens: QuickAddToken[], blockedIndexes: Set<number>) {
  return tokens
    .filter((token) => !blockedIndexes.has(token.index))
    .map((token) => token.raw)
    .join(" ")
    .trim();
}

function applyLocationDefaults(
  draft: QuickAddDraft,
  location: LocationTemplateRecord | undefined,
) {
  if (!location) {
    return;
  }

  draft.locationTemplateId = location.id;
  draft.location = location.address;
  draft.description = draft.description || location.defaultDescription || "";
  draft.link = draft.link || location.link || "";
}

function getTemplateLocation(
  locations: LocationTemplateRecord[],
  template: EventTemplateRecord | undefined,
) {
  if (!template?.locationTemplateId) {
    return undefined;
  }

  return locations.find((location) => location.id === template.locationTemplateId);
}

function buildDefaultDraft(context: QuickAddParserContext, dateContext: DateContext): QuickAddDraft {
  const singleActiveCalendar =
    context.calendars.filter((calendar) => calendar.isActive).length === 1
      ? context.calendars.find((calendar) => calendar.isActive)
      : null;
  const defaultCategory = context.categories.find((category) => category.isActive) ?? context.categories[0];

  return {
    calendarId: singleActiveCalendar?.id,
    title: "",
    categoryId: defaultCategory?.id,
    category: defaultCategory?.name,
    startDate: dateContext.todayKey,
    startTime: "09:00",
    endDate: dateContext.todayKey,
    endTime: "10:00",
    allDay: false,
    location: "",
    locationTemplateId: undefined,
    description: "",
    link: "",
    reminders: defaultCategory?.defaultReminderMinutes ?? [],
    reminderInput: remindersToInputString(defaultCategory?.defaultReminderMinutes ?? []),
    templateId: undefined,
  };
}

export function parseQuickAddInput(
  input: string,
  context: QuickAddParserContext,
): QuickAddParseResult {
  const normalizedInput = input.trim();
  const now = context.now ?? new Date();
  const dateContext = buildDateContext(now, context.timezone);
  const tokens = tokenizeQuickAddInput(normalizedInput);
  const warnings: string[] = [];
  const matchedEntities = selectEntityMatches(context, tokens);
  const dateInfo = parseDateInfo(tokens, dateContext);
  const timeInfo = parseTimeInfo(tokens);
  const durationInfo = parseDurationInfo(tokens);
  const allDayIndexes = collectAllDayIndexes(tokens);
  const template = matchedEntities.template?.entity;
  const location = matchedEntities.location?.entity;
  const calendar = matchedEntities.calendar?.entity;
  const category = matchedEntities.category?.entity;

  const draft = buildDefaultDraft(context, dateContext);

  if (template) {
    draft.templateId = template.id;
    draft.title = template.titleTemplate;
    draft.categoryId = template.categoryId;
    draft.category = template.categoryName;
    draft.allDay = template.isAllDayDefault;
    draft.description = template.defaultDescription ?? "";
    draft.reminders = template.defaultReminderMinutes;
    draft.reminderInput = remindersToInputString(template.defaultReminderMinutes);
  }

  if (category) {
    draft.categoryId = category.id;
    draft.category = category.name;

    if (!template) {
      draft.reminders = category.defaultReminderMinutes;
      draft.reminderInput = remindersToInputString(category.defaultReminderMinutes);
    }
  }

  applyLocationDefaults(draft, getTemplateLocation(context.locations, template));
  applyLocationDefaults(draft, location);

  if (calendar) {
    draft.calendarId = calendar.id;
  }

  if (dateInfo) {
    draft.startDate = dateInfo.startDate;
    draft.endDate = dateInfo.endDate ?? dateInfo.startDate;
  } else {
    warnings.push("Kein Datum erkannt. Der Entwurf startet vorläufig heute.");
  }

  const hasExplicitAllDay = allDayIndexes.size > 0;
  draft.allDay = hasExplicitAllDay || draft.allDay;

  if (dateInfo?.endDate && !draft.allDay && !timeInfo) {
    draft.allDay = true;
    warnings.push("Mehrtägiger Zeitraum ohne Uhrzeit wurde als Ganztag interpretiert.");
  }

  if (draft.allDay) {
    draft.startTime = undefined;
    draft.endTime = undefined;

    if (timeInfo) {
      warnings.push("Eine erkannte Uhrzeit wird bei Ganztagsterminen ignoriert.");
    }
  } else {
    if (timeInfo) {
      draft.startTime = timeInfo.time;
    } else {
      draft.startTime = "09:00";
      warnings.push("Keine Uhrzeit erkannt. Startzeit wurde auf 09:00 gesetzt.");
    }

    const durationMinutes =
      durationInfo?.minutes ??
      template?.defaultDurationMinutes ??
      category?.defaultDurationMinutes ??
      60;

    if (!durationInfo) {
      warnings.push(
        template?.defaultDurationMinutes || category?.defaultDurationMinutes
          ? "Keine Dauer erkannt. Die Standarddauer aus Vorlage oder Kategorie wird verwendet."
          : "Keine Dauer erkannt. Der Entwurf verwendet 60 Minuten.",
      );
    }

    const endValues = applyDurationToLocalDateTime(
      draft.startDate,
      draft.startTime,
      durationMinutes,
      context.timezone,
    );

    draft.endDate = endValues.endDate;
    draft.endTime = endValues.endTime;

    if (dateInfo?.endDate && dateInfo.endDate !== draft.startDate) {
      warnings.push("Ein explizites Enddatum ohne Ganztag wird im Entwurf nicht als Serien- oder Mehrtages-Termin übernommen.");
    }
  }

  const blockedTitleIndexes = new Set<number>();
  addMatchIndexes(blockedTitleIndexes, matchedEntities.template);
  addMatchIndexes(blockedTitleIndexes, matchedEntities.location);
  addMatchIndexes(blockedTitleIndexes, matchedEntities.calendar);

  if (dateInfo) {
    for (const index of dateInfo.consumedIndexes) {
      blockedTitleIndexes.add(index);
    }
  }

  if (timeInfo) {
    for (const index of timeInfo.consumedIndexes) {
      blockedTitleIndexes.add(index);
    }
  }

  if (durationInfo) {
    for (const index of durationInfo.consumedIndexes) {
      blockedTitleIndexes.add(index);
    }
  }

  for (const index of allDayIndexes) {
    blockedTitleIndexes.add(index);
  }

  const withoutCategoryIndexes = new Set(blockedTitleIndexes);
  addMatchIndexes(withoutCategoryIndexes, matchedEntities.category);

  const titleWithoutCategory = buildRemainingTitle(tokens, withoutCategoryIndexes);
  const titleWithCategory = buildRemainingTitle(tokens, blockedTitleIndexes);

  draft.title =
    titleWithoutCategory ||
    titleWithCategory ||
    template?.titleTemplate ||
    category?.name ||
    draft.title;

  if (!draft.title) {
    warnings.push("Kein Titel erkannt. Bitte prüfe den Entwurf im Formular.");
  }

  if (!draft.category) {
    warnings.push("Keine Kategorie erkannt. Bitte wähle sie im Formular aus.");
  }

  return {
    rawInput: normalizedInput,
    draft,
    warnings,
    matched: {
      categoryName: category?.name,
      locationName: location?.name,
      templateName: template?.name,
      calendarName: calendar?.displayName,
    },
  };
}
