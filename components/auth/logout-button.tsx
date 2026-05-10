"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    startTransition(async () => {
      setIsLoading(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      setIsLoading(false);

      if (!response.ok) {
        toast.error("Logout fehlgeschlagen.");
        return;
      }

      toast.success("Du wurdest ausgeloggt.");
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <Button
      className={cn(className)}
      disabled={isPending || isLoading}
      onClick={handleLogout}
      type="button"
      variant="outline"
    >
      <LogOut className="size-4" />
      {isPending || isLoading ? "Logout..." : "Logout"}
    </Button>
  );
}
