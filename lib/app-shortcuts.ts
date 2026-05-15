import type { DefaultView } from "@/types/entities";

export const CALENDAR_TODAY_EVENT_NAME = "sarfex:calendar-today";
export const CALENDAR_VIEW_EVENT_NAME = "sarfex:calendar-view";

export function focusQuickAddInput() {
  if (typeof document === "undefined") {
    return false;
  }

  const input = document.querySelector<HTMLInputElement>('[data-quick-add-input="true"]');

  if (!input) {
    return false;
  }

  input.focus();
  input.select();
  return true;
}

export function focusSearchInput() {
  if (typeof document === "undefined") {
    return false;
  }

  const input = document.querySelector<HTMLInputElement>('[data-search-input="true"]');

  if (!input) {
    return false;
  }

  input.focus();
  input.select();
  return true;
}

export function dispatchCalendarToday() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(CALENDAR_TODAY_EVENT_NAME));
}

export function dispatchCalendarView(view: DefaultView) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CALENDAR_VIEW_EVENT_NAME, {
      detail: { view },
    }),
  );
}
