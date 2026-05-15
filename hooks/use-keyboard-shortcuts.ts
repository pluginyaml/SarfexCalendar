"use client";

import { useEffect, useEffectEvent } from "react";

type KeyboardShortcutHandlers = {
  onNewEvent?: () => void;
  onQuickAdd?: () => void;
  onToday?: () => void;
  onDayView?: () => void;
  onWeekView?: () => void;
  onMonthView?: () => void;
  onSearch?: () => void;
  onCommandPalette?: () => void;
  onEscape?: () => void;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable || target.closest("[contenteditable='true']")) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing) {
      return;
    }

    const key = event.key.toLowerCase();
    const editableTarget = isEditableTarget(event.target);

    if (editableTarget && key !== "escape") {
      return;
    }

    if (key === "escape") {
      if (handlers.onEscape) {
        event.preventDefault();
        handlers.onEscape();
      }

      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      if ((event.metaKey || event.ctrlKey) && key === "k" && handlers.onCommandPalette) {
        event.preventDefault();
        handlers.onCommandPalette();
      }

      return;
    }

    switch (key) {
      case "n":
        event.preventDefault();
        handlers.onNewEvent?.();
        break;
      case "q":
        event.preventDefault();
        handlers.onQuickAdd?.();
        break;
      case "t":
        event.preventDefault();
        handlers.onToday?.();
        break;
      case "d":
        event.preventDefault();
        handlers.onDayView?.();
        break;
      case "w":
        event.preventDefault();
        handlers.onWeekView?.();
        break;
      case "m":
        event.preventDefault();
        handlers.onMonthView?.();
        break;
      case "/":
        event.preventDefault();
        handlers.onSearch?.();
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event);

    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);
}
