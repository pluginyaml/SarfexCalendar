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
        className="fixed bottom-20 right-3 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 md:hidden"
      >
        <Plus className="size-5" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/88 px-2.5 py-2 backdrop-blur md:hidden">
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
