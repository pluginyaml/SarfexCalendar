export const recurrencePresets = [
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "yearly",
  "custom",
] as const;

export const recurrenceFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export const recurrenceWeekdays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;
export const recurrenceEndModes = ["never", "count", "until"] as const;

export type RecurrencePreset = (typeof recurrencePresets)[number];
export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];
export type RecurrenceWeekday = (typeof recurrenceWeekdays)[number];
export type RecurrenceEndMode = (typeof recurrenceEndModes)[number];

export type EventRecurrenceInput = {
  preset: RecurrencePreset;
  frequency?: RecurrenceFrequency;
  interval?: number;
  byWeekdays?: RecurrenceWeekday[];
  endMode?: RecurrenceEndMode;
  count?: number;
  until?: string;
};
