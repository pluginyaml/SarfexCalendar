"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  MapPinned,
  Plus,
  Search,
  Settings,
  Sparkles,
  Tags,
} from "lucide-react";
import type { DefaultView } from "@/types/entities";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFocusQuickAdd: () => void;
  onCalendarToday: () => void;
  onCalendarView: (view: DefaultView) => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onFocusQuickAdd,
  onCalendarToday,
  onCalendarView,
}: CommandPaletteProps) {
  const pathname = usePathname();
  const router = useRouter();

  const runAction = (action: () => void) => {
    onOpenChange(false);
    window.setTimeout(action, 0);
  };

  const navigateTo = (href: string) => {
    runAction(() => {
      router.push(href);
    });
  };

  const handleQuickAdd = () => {
    runAction(() => {
      if (pathname === "/" || pathname.startsWith("/calendar") || pathname.startsWith("/events")) {
        onFocusQuickAdd();
        return;
      }

      router.push("/events?quickAddFocus=1");
    });
  };

  const handleToday = () => {
    runAction(() => {
      if (pathname.startsWith("/calendar")) {
        onCalendarToday();
        return;
      }

      router.push("/calendar");
    });
  };

  const handleCalendarView = (view: DefaultView) => {
    runAction(() => {
      if (pathname.startsWith("/calendar")) {
        onCalendarView(view);
        return;
      }

      router.push(`/calendar?view=${view}`);
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>Schneller Zugriff auf Navigation, Ansichten und Event-Aktionen.</DialogDescription>
        </DialogHeader>

        <Command shouldFilter>
          <CommandInput placeholder="Aktionen, Seiten oder Ansichten suchen..." />
          <CommandList>
            <CommandEmpty>Keine passenden Befehle gefunden.</CommandEmpty>

            <CommandGroup heading="Aktionen">
              <CommandItem onSelect={() => navigateTo("/events/new")}>
                <Plus className="size-4" />
                <span>Neuer Termin</span>
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={handleQuickAdd}>
                <Sparkles className="size-4" />
                <span>Quick Add</span>
                <CommandShortcut>Q</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={handleToday}>
                <CalendarDays className="size-4" />
                <span>Heute öffnen</span>
                <CommandShortcut>T</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Kalenderansicht">
              <CommandItem onSelect={() => handleCalendarView("day")}>
                <Calendar className="size-4" />
                <span>Tagansicht</span>
                <CommandShortcut>D</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleCalendarView("week")}>
                <Calendar className="size-4" />
                <span>Wochenansicht</span>
                <CommandShortcut>W</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleCalendarView("month")}>
                <Calendar className="size-4" />
                <span>Monatsansicht</span>
                <CommandShortcut>M</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleCalendarView("year")}>
                <Calendar className="size-4" />
                <span>Jahresansicht</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => navigateTo("/")}>
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => navigateTo("/calendar")}>
                <CalendarDays className="size-4" />
                <span>Kalender</span>
              </CommandItem>
              <CommandItem onSelect={() => navigateTo("/events")}>
                <CalendarClock className="size-4" />
                <span>Termine</span>
              </CommandItem>
              <CommandItem onSelect={() => navigateTo("/categories")}>
                <Tags className="size-4" />
                <span>Kategorien</span>
              </CommandItem>
              <CommandItem onSelect={() => navigateTo("/locations")}>
                <MapPinned className="size-4" />
                <span>Standorte</span>
              </CommandItem>
              <CommandItem onSelect={() => navigateTo("/templates")}>
                <FolderKanban className="size-4" />
                <span>Vorlagen</span>
              </CommandItem>
              <CommandItem onSelect={() => navigateTo("/settings")}>
                <Settings className="size-4" />
                <span>Einstellungen</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>

          <div className="flex flex-wrap items-center gap-2 border-t border-black/6 px-4 py-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Search className="size-3.5" />
              <span>Cmd/Ctrl+K für Palette</span>
            </div>
            <span>Esc schließt offene Overlays</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
