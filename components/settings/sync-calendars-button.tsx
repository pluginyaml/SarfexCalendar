"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type SyncCalendarsButtonProps = {
  disabled?: boolean;
  isPending?: boolean;
  onClick?: () => void;
};

export function SyncCalendarsButton({
  disabled,
  isPending,
  onClick,
}: SyncCalendarsButtonProps) {
  return (
    <Button
      disabled={disabled || isPending}
      onClick={onClick}
      type="button"
      variant="outline"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
      {isPending ? "Synchronisiert..." : "Kalender synchronisieren"}
    </Button>
  );
}
