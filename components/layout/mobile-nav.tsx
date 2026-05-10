"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { mobileNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/events/new"
        className="fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 md:hidden"
      >
        <Plus className="size-6" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/85 px-3 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          {mobileNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors",
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
