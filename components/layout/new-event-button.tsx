"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NewEventButtonProps = {
  href?: string;
  className?: string;
  size?: "sm" | "default";
};

export function NewEventButton({
  href = "/events/new",
  className,
  size = "sm",
}: NewEventButtonProps) {
  return (
    <Button asChild className={cn("gap-1.5 rounded-[0.8rem]", className)} size={size}>
      <Link href={href}>
        <Plus className={size === "sm" ? "size-3.5" : "size-4"} />
        <span>Termin</span>
      </Link>
    </Button>
  );
}
