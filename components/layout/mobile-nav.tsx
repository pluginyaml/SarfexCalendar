"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewEventButton } from "@/components/layout/new-event-button";
import { mobileNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <NewEventButton
        className="fixed bottom-20 right-3 z-40 rounded-full px-4 py-3 text-sm shadow-[0_12px_28px_rgba(15,23,42,0.12)] md:hidden"
        size="default"
      />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/6 bg-white/90 px-2.5 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-1.5">
          {mobileNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors",
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-3.5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
