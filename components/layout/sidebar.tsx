"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { appNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type SidebarProps = {
  userEmail: string;
};

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn("fixed inset-y-0 left-0 z-40 hidden md:block", isOpen ? "w-64" : "w-10")}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        aria-expanded={isOpen}
        aria-label="Navigation anzeigen"
        className="absolute left-2 top-2 z-50 flex size-7 items-center justify-center rounded-xl border border-white/70 bg-white/88 text-foreground shadow-sm backdrop-blur transition hover:bg-white"
        onClick={() => setIsOpen((current) => !current)}
        onFocus={() => setIsOpen(true)}
        onMouseEnter={() => setIsOpen(true)}
        type="button"
      >
        <CalendarDays className="size-3.5" />
      </button>

      <div className="absolute inset-y-0 left-0 w-3" onMouseEnter={() => setIsOpen(true)} />

      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-60 flex-col border-r border-black/5 bg-white/88 px-3 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition duration-200 ease-out",
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0",
        )}
        onMouseEnter={() => setIsOpen(true)}
      >
        <div className="mb-4 flex items-center gap-2.5 pl-8">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Sarfex
            </p>
            <p className="text-sm font-semibold tracking-tight">Calendar</p>
          </div>
        </div>

        <Button asChild className="mb-4 h-9 w-full justify-center rounded-xl text-xs">
          <Link href="/events/new" onClick={() => setIsOpen(false)}>
            + Termin
          </Link>
        </Button>

        <ScrollArea className="flex-1">
          <nav className="space-y-1 pr-1">
            {appNavigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="mt-4 rounded-[1.1rem] border border-white/70 bg-white/72 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Eingeloggt als
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-foreground">{userEmail}</p>
          <LogoutButton className="mt-3 h-8 w-full rounded-xl text-xs" />
        </div>
      </aside>
    </div>
  );
}
