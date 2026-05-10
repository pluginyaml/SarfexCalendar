"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { appNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/60 bg-white/70 px-5 py-6 backdrop-blur md:flex md:flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sarfex
          </p>
          <p className="text-lg font-semibold tracking-tight">Calendar</p>
        </div>
      </div>

      <Button asChild className="mb-5 w-full justify-center">
        <Link href="/events/new">+ Termin</Link>
      </Button>

      <ScrollArea className="flex-1">
        <nav className="space-y-1 pr-3">
          {appNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
