export function normalizeReminderMinutes(input: unknown): number[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<number>();
  const result: number[] = [];

  for (const value of input) {
    const parsedValue =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : Number.NaN;

    if (!Number.isInteger(parsedValue) || parsedValue <= 0 || seen.has(parsedValue)) {
      continue;
    }

    seen.add(parsedValue);
    result.push(parsedValue);
  }

  return result;
}

export function remindersToInputString(reminders: number[]) {
  return reminders.join(", ");
}

export function parseReminderInput(input: string) {
  const values = input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value));

  return normalizeReminderMinutes(values);
}

export function formatReminderMinutes(reminders: number[]) {
  if (reminders.length === 0) {
    return "Keine Erinnerung";
  }

  return reminders
    .map((value) => {
      if (value % 1440 === 0) {
        const days = value / 1440;
        return `${days} Tag${days === 1 ? "" : "e"} vorher`;
      }

      if (value % 60 === 0) {
        const hours = value / 60;
        return `${hours} Std vorher`;
      }

      return `${value} Min vorher`;
    })
    .join(", ");
}
