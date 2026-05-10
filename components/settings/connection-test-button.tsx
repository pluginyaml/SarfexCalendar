"use client";

import { Loader2, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ConnectionTestButtonProps = {
  className?: string;
  disabled?: boolean;
  isPending?: boolean;
  onClick?: () => void;
};

export function ConnectionTestButton({
  className,
  disabled,
  isPending,
  onClick,
}: ConnectionTestButtonProps) {
  return (
    <Button
      className={cn(className)}
      disabled={disabled || isPending}
      onClick={onClick}
      type="button"
      variant="secondary"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
      {isPending ? "Prueft..." : "Verbindung testen"}
    </Button>
  );
}
