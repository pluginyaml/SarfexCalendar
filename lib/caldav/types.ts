export type { EventViewModel } from "@/lib/calendar/types";
import type { EventRecurrenceInput } from "@/lib/recurrence/types";

export type CalDavEventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay: boolean;
  category: string;
  reminders: number[];
  recurrence?: EventRecurrenceInput | null;
};

export type CalDavConnectionResult = {
  ok: true;
  message: string;
  calendarUrl: string;
};
