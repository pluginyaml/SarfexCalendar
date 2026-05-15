import type { QuickAddDraft, StoredQuickAddDraft } from "@/lib/quick-add/types";

const QUICK_ADD_STORAGE_KEY = "sarfex.quick-add.draft";

export function storeQuickAddDraft(draft: QuickAddDraft) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredQuickAddDraft = {
    version: 2,
    createdAt: new Date().toISOString(),
    draft,
  };

  window.sessionStorage.setItem(QUICK_ADD_STORAGE_KEY, JSON.stringify(payload));
}

export function clearQuickAddDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(QUICK_ADD_STORAGE_KEY);
}

export function readQuickAddDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(QUICK_ADD_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredQuickAddDraft;

    if (
      !parsedValue?.draft ||
      (parsedValue.version !== 1 && parsedValue.version !== 2)
    ) {
      return null;
    }

    return parsedValue.draft as QuickAddDraft;
  } catch {
    return null;
  }
}

export function consumeQuickAddDraft() {
  const draft = readQuickAddDraft();
  clearQuickAddDraft();
  return draft;
}
