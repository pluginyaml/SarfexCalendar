export type DefaultView = "day" | "week" | "month";

export type CategoryRecord = {
  id: string;
  name: string;
  color: string;
  icon: string;
  defaultDurationMinutes: number;
  defaultReminderMinutes: number[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LocationTemplateRecord = {
  id: string;
  name: string;
  address: string;
  link: string | null;
  notes: string | null;
  defaultDescription: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventTemplateRecord = {
  id: string;
  name: string;
  titleTemplate: string;
  categoryId: string;
  categoryName: string;
  locationTemplateId: string | null;
  locationTemplateName: string | null;
  defaultDurationMinutes: number;
  defaultDescription: string | null;
  defaultReminderMinutes: number[];
  isAllDayDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UiSettingsRecord = {
  id: string;
  defaultView: DefaultView;
  weekStartsOn: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};
