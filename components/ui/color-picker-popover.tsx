"use client";

import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ColorPickerPopoverProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

const COLOR_SWATCHES = [
  "#2563EB",
  "#0F766E",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#EAB308",
  "#16A34A",
  "#475569",
];

function normalizeHexColor(value: string) {
  const normalized = value.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  return /^#([0-9A-F]{6})$/.test(normalized) ? normalized : null;
}

export function ColorPickerPopover({
  value,
  onChange,
  placeholder = "Farbe wählen",
  disabled = false,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value ?? "");

  const normalizedDraftValue = useMemo(() => normalizeHexColor(draftValue), [draftValue]);

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setDraftValue(value ?? "");
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          className="w-full justify-start rounded-[0.8rem] px-3 text-left"
          disabled={disabled}
          type="button"
          variant="outline"
        >
          <span
            className="inline-flex size-4 rounded-full border border-black/10"
            style={{ backgroundColor: value ?? "transparent" }}
          />
          <span className="truncate">{value ?? placeholder}</span>
          <Palette className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Farbe wählen</p>
          <p className="text-xs text-muted-foreground">Palette oder eigener HEX-Wert</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {COLOR_SWATCHES.map((color) => (
            <button
              aria-label={`Farbe ${color}`}
              className={`h-9 rounded-xl border transition-transform hover:scale-[1.02] ${
                (value ?? "").toUpperCase() === color
                  ? "border-foreground ring-2 ring-foreground/15"
                  : "border-black/10"
              }`}
              key={color}
              onClick={() => {
                setDraftValue(color);
                onChange(color);
              }}
              style={{ backgroundColor: color }}
              type="button"
            />
          ))}
        </div>

        <div className="space-y-2">
          <Input
            maxLength={7}
            onChange={(event) => setDraftValue(event.target.value)}
            placeholder="#2563EB"
            value={draftValue}
          />
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white/70 px-3 py-2">
            <span
              className="inline-flex size-5 rounded-full border border-black/10"
              style={{ backgroundColor: normalizedDraftValue ?? "transparent" }}
            />
            <span className="text-xs text-muted-foreground">
              {normalizedDraftValue ?? "Bitte einen gültigen HEX-Wert eingeben."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <Button
            onClick={() => {
              onChange(null);
              setDraftValue("");
              setOpen(false);
            }}
            type="button"
            variant="ghost"
          >
            Zurücksetzen
          </Button>
          <Button
            disabled={!normalizedDraftValue}
            onClick={() => {
              if (!normalizedDraftValue) {
                return;
              }

              onChange(normalizedDraftValue);
              setOpen(false);
            }}
            type="button"
          >
            Übernehmen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
