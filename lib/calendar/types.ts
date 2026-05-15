export type EventWarning = {
  code: string;
  message: string;
  calendarId?: string | null;
  calendarName?: string | null;
};

export type EventViewModel = {
  id: string;
  uid: string;
  href: string;
  etag: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  category: string;
  color?: string;
  lastModified?: string | null;
  reminders: number[];
  calendarId: string | null;
  calendarHref: string | null;
  calendarName: string | null;
  calendarColor: string | null;
  recurrenceRule: string | null;
  instanceKey: string;
  isRecurring: boolean;
  isRecurringInstance: boolean;
  canDrag: boolean;
};

export type EventListResponse = {
  events: EventViewModel[];
  warnings: EventWarning[];
};
