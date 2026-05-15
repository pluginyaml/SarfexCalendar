import type {
  CalendarSourceRecord,
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";

export type QuickAddDraft = {
  calendarId?: string;
  title: string;
  categoryId?: string;
  category?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  allDay: boolean;
  location: string;
  locationTemplateId?: string;
  description: string;
  link: string;
  reminders: number[];
  reminderInput?: string;
  templateId?: string;
};

export type QuickAddMatchSummary = {
  categoryName?: string;
  locationName?: string;
  templateName?: string;
  calendarName?: string;
};

export type QuickAddParseResult = {
  rawInput: string;
  draft: QuickAddDraft;
  warnings: string[];
  matched: QuickAddMatchSummary;
};

export type QuickAddParserContext = {
  now?: Date;
  timezone: string;
  categories: CategoryRecord[];
  locations: LocationTemplateRecord[];
  templates: EventTemplateRecord[];
  calendars: CalendarSourceRecord[];
};

export type StoredQuickAddDraft = {
  version: 1 | 2;
  createdAt: string;
  draft: QuickAddDraft;
};
