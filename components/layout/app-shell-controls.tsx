"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { dispatchCalendarToday, dispatchCalendarView, focusQuickAddInput, focusSearchInput } from "@/lib/app-shortcuts";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";

export function AppShellControls() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleQuickAdd = () => {
    if (focusQuickAddInput()) {
      return;
    }

    if (!pathname.startsWith("/events")) {
      router.push("/events?quickAddFocus=1");
    }
  };

  const handleToday = () => {
    if (pathname.startsWith("/calendar")) {
      dispatchCalendarToday();
      return;
    }

    router.push("/calendar");
  };

  const handleCalendarView = (view: "day" | "week" | "month" | "year") => {
    if (pathname.startsWith("/calendar")) {
      dispatchCalendarView(view);
      return;
    }

    router.push(`/calendar?view=${view}`);
  };

  useKeyboardShortcuts({
    onNewEvent: () => router.push("/events/new"),
    onQuickAdd: handleQuickAdd,
    onToday: handleToday,
    onDayView: () => handleCalendarView("day"),
    onWeekView: () => handleCalendarView("week"),
    onMonthView: () => handleCalendarView("month"),
    onSearch: () => {
      focusSearchInput();
    },
    onCommandPalette: () => setIsCommandPaletteOpen(true),
    onEscape: () => setIsCommandPaletteOpen(false),
  });

  return (
    <>
      <CommandPalette
        onCalendarToday={handleToday}
        onCalendarView={handleCalendarView}
        onFocusQuickAdd={handleQuickAdd}
        onOpenChange={setIsCommandPaletteOpen}
        open={isCommandPaletteOpen}
      />

      <Button
        className="fixed bottom-20 left-3 z-40 rounded-full px-4 shadow-[0_12px_28px_rgba(15,23,42,0.12)] md:hidden"
        onClick={() => setIsCommandPaletteOpen(true)}
        type="button"
        variant="outline"
      >
        <Search className="size-4" />
        Suche
      </Button>
    </>
  );
}
