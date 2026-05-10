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
};

export type CalDavEventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay: boolean;
  category: string;
  reminders: number[];
};

export type CalDavConnectionResult = {
  ok: true;
  message: string;
  calendarUrl: string;
};
