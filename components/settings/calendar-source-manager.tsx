"use client";

import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import type { CalendarSourceRecord } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPickerPopover } from "@/components/ui/color-picker-popover";
import { InfoPopover } from "@/components/ui/info-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type CalendarSourceManagerProps = {
  calendars: CalendarSourceRecord[];
  isSaving: boolean;
  isSyncing: boolean;
  onSave: (payload: {
    calendars: Array<{
      id: string;
      displayName: string;
      color: string | null;
      isActive: boolean;
      isDefault: boolean;
      sortOrder: number;
    }>;
  }) => Promise<void>;
  onSync: () => Promise<void>;
};

type CalendarSourceDraft = CalendarSourceRecord;

function normalizeHexColor(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? null : trimmed.toUpperCase();
}

export function CalendarSourceManager({
  calendars,
  isSaving,
  isSyncing,
  onSave,
  onSync,
}: CalendarSourceManagerProps) {
  const [drafts, setDrafts] = useState<CalendarSourceDraft[]>(calendars);

  const activeCalendarCount = useMemo(
    () => drafts.filter((calendar) => calendar.isActive).length,
    [drafts],
  );

  const handleFieldChange = <Key extends keyof CalendarSourceDraft>(
    id: string,
    key: Key,
    value: CalendarSourceDraft[Key],
  ) => {
    setDrafts((current) =>
      current.map((calendar) => (calendar.id === id ? { ...calendar, [key]: value } : calendar)),
    );
  };

  const handleSetDefault = (id: string) => {
    setDrafts((current) =>
      current.map((calendar) => ({
        ...calendar,
        isActive: calendar.id === id ? true : calendar.isActive,
        isDefault: calendar.id === id,
      })),
    );
  };

  const handleActiveToggle = (id: string, checked: boolean) => {
    setDrafts((current) => {
      const target = current.find((calendar) => calendar.id === id);

      if (!target) {
        return current;
      }

      if (target.isMissingRemote) {
        toast.error(
          "Fehlende Remote-Kalender können erst nach einem erfolgreichen Sync aktiviert werden.",
        );
        return current;
      }

      if (!checked && target.isActive && activeCalendarCount <= 1) {
        toast.error("Mindestens ein Kalender muss aktiv bleiben.");
        return current;
      }

      const nextDrafts = current.map((calendar) =>
        calendar.id === id
          ? {
              ...calendar,
              isActive: checked,
            }
          : calendar,
      );

      if (!checked && target.isDefault) {
        const nextDefault =
          nextDrafts
            .filter((calendar) => calendar.id !== id && calendar.isActive)
            .sort((left, right) => left.sortOrder - right.sortOrder)[0] ?? null;

        return nextDrafts.map((calendar) => ({
          ...calendar,
          isDefault: nextDefault ? calendar.id === nextDefault.id : false,
        }));
      }

      return nextDrafts;
    });
  };

  const handleSave = async () => {
    await onSave({
      calendars: drafts.map((calendar) => ({
        id: calendar.id,
        displayName: calendar.displayName.trim(),
        color: normalizeHexColor(calendar.color),
        isActive: calendar.isActive,
        isDefault: calendar.isDefault,
        sortOrder: calendar.sortOrder,
      })),
    });
  };

  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <CardTitle>Kalenderquellen</CardTitle>
            <InfoPopover
              description="Nur aktive Kalender werden geladen. Der Standardkalender ist beim Erstellen vorausgewählt. Nicht mehr gefundene Remote-Kalender bleiben dokumentiert, werden aber klar markiert."
              title="Kalenderquellen"
            />
          </div>
          <CardDescription>Kalender erkennen, aktivieren und sortieren.</CardDescription>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={isSyncing} onClick={onSync} type="button" variant="outline">
            <RefreshCcw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Synchronisiert..." : "Kalender neu erkennen"}
          </Button>
          <Button disabled={isSaving || drafts.length === 0} onClick={handleSave} type="button">
            {isSaving ? "Speichert..." : "Kalender speichern"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {drafts.map((calendar) => (
          <div
            className="rounded-[1.2rem] border border-border bg-white/75 p-4"
            key={calendar.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{calendar.displayName}</p>

                  {calendar.isDefault ? (
                    <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-foreground">
                      Standard
                    </span>
                  ) : null}

                  {!calendar.isActive ? (
                    <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] text-muted-foreground">
                      Inaktiv
                    </span>
                  ) : null}

                  {calendar.isMissingRemote ? (
                    <div className="flex items-center gap-1">
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        Remote nicht gefunden
                      </span>
                      <InfoPopover
                        description="Dieser Kalender wurde beim letzten Sync auf dem Server nicht mehr gefunden. Er bleibt lokal erhalten, wird aber nicht mehr normal verwendet."
                        title="Missing Remote"
                      />
                    </div>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground">
                  Remote: {calendar.remoteName} · {calendar.normalizedHref}
                </p>

                {calendar.lastSeenAt ? (
                  <p className="text-xs text-muted-foreground">
                    Zuletzt gesehen: {new Date(calendar.lastSeenAt).toLocaleString("de-DE")}
                  </p>
                ) : null}
              </div>

            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.5fr]">
              <div className="space-y-2">
                <Label htmlFor={`calendar-display-name-${calendar.id}`}>Anzeigename</Label>
                <Input
                  id={`calendar-display-name-${calendar.id}`}
                  onChange={(event) =>
                    handleFieldChange(calendar.id, "displayName", event.target.value)
                  }
                  value={calendar.displayName}
                />
              </div>

              <div className="space-y-2">
                <Label>Farbe</Label>
                <ColorPickerPopover
                  onChange={(value) => handleFieldChange(calendar.id, "color", value)}
                  placeholder={calendar.remoteColor ?? "#2563EB"}
                  value={calendar.color}
                />
                <p className="text-xs text-muted-foreground">
                  Remote-Farbe: {calendar.remoteColor ?? "keine"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`calendar-order-${calendar.id}`}>Sortierung</Label>
                <Input
                  id={`calendar-order-${calendar.id}`}
                  min={0}
                  onChange={(event) =>
                    handleFieldChange(calendar.id, "sortOrder", Number(event.target.value) || 0)
                  }
                  type="number"
                  value={calendar.sortOrder}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-[1rem] border border-border bg-white/65 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">
                    {calendar.isDefault ? "Standardkalender" : "Optionaler Kalender"}
                  </p>
                  <InfoPopover
                    description="Der Standardkalender wird beim Erstellen neuer Termine automatisch vorausgewählt, wenn kein anderer Kalender gewählt wurde."
                    title="Standardkalender"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{calendar.normalizedUrl}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Aktiv</span>
                  <InfoPopover
                    description="Nur aktive Kalender erscheinen in Kalenderansicht und Terminliste und können für neue Termine verwendet werden."
                    title="Aktiv"
                  />
                  <Switch
                    checked={calendar.isActive}
                    disabled={calendar.isMissingRemote}
                    onCheckedChange={(checked) => handleActiveToggle(calendar.id, checked)}
                  />
                </div>

                <Button
                  disabled={!calendar.isActive || calendar.isMissingRemote}
                  onClick={() => handleSetDefault(calendar.id)}
                  type="button"
                  variant={calendar.isDefault ? "default" : "outline"}
                >
                  {calendar.isDefault ? "Standard" : "Als Standard setzen"}
                </Button>
              </div>
            </div>
          </div>
        ))}

        {drafts.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-border bg-white/60 px-4 py-5 text-sm text-muted-foreground">
            Es wurden noch keine Kalenderquellen erkannt.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
