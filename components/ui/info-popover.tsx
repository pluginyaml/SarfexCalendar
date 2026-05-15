"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useClientReady } from "@/hooks/use-client-ready";

type InfoPopoverProps = {
  title: string;
  description: string;
};

export function InfoPopover({ title, description }: InfoPopoverProps) {
  const isClientReady = useClientReady();
  const [open, setOpen] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const pointerPressRef = useRef(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPopover = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 100);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isClientReady) {
      return;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateSupport = () => {
      setSupportsHover(mediaQuery.matches);
    };

    updateSupport();
    mediaQuery.addEventListener("change", updateSupport);

    return () => {
      mediaQuery.removeEventListener("change", updateSupport);
    };
  }, [isClientReady]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  if (supportsHover) {
    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            aria-label={title}
            className="size-6 rounded-full text-muted-foreground"
            onBlur={scheduleClose}
            onClick={openPopover}
            onFocus={openPopover}
            onMouseEnter={openPopover}
            onMouseLeave={scheduleClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Info className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="pointer-events-none space-y-1.5 select-none"
          onCloseAutoFocus={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-5 text-muted-foreground">{description}</p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          aria-label={title}
          className="size-6 rounded-full text-muted-foreground"
          onBlur={() => {
            pointerPressRef.current = false;
            setOpen(false);
          }}
          onClick={() => {
            clearCloseTimer();
            setOpen((currentOpen) => !currentOpen);
          }}
          onFocus={() => {
            if (pointerPressRef.current) {
              pointerPressRef.current = false;
              return;
            }

            openPopover();
          }}
          onPointerDown={() => {
            pointerPressRef.current = true;
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Info className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="space-y-1.5"
        onCloseAutoFocus={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-5 text-muted-foreground">{description}</p>
      </PopoverContent>
    </Popover>
  );
}
