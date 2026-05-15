"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { requestJson } from "@/lib/http-client";
import { storeQuickAddDraft } from "@/lib/quick-add/draft-storage";
import { parseQuickAddInput } from "@/lib/quick-add/parser";
import type { QuickAddParseResult } from "@/lib/quick-add/types";
import type {
  CalendarSourceRecord,
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type QuickAddProps = {
  timezone: string;
  className?: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

export function QuickAdd({
  timezone,
  className,
  title = "Quick Add",
  description = "Natürliche Eingabe wird in einen prüfbaren Event-Entwurf umgewandelt.",
  compact = false,
}: QuickAddProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [input, setInput] = useState("");
  const [parseResult, setParseResult] = useState<QuickAddParseResult | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [locations, setLocations] = useState<LocationTemplateRecord[]>([]);
  const [templates, setTemplates] = useState<EventTemplateRecord[]>([]);
  const [calendars, setCalendars] = useState<CalendarSourceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metaWarning, setMetaWarning] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [categoriesResult, locationsResult, templatesResult, calendarsResult] =
          await Promise.all([
            requestJson<CategoryRecord[]>("/api/categories"),
            requestJson<LocationTemplateRecord[]>("/api/locations"),
            requestJson<EventTemplateRecord[]>("/api/templates"),
            requestJson<CalendarSourceRecord[]>("/api/calendars"),
          ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoriesResult);
        setLocations(locationsResult);
        setTemplates(templatesResult);
        setCalendars(
          calendarsResult.filter((calendar) => calendar.isActive && !calendar.isMissingRemote),
        );
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setMetaWarning(
          loadError instanceof Error
            ? loadError.message
            : "Metadaten für Quick Add konnten nicht vollständig geladen werden.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get("quickAddFocus") !== "1") {
      return;
    }

    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, []);

  const resolvedCalendarName = useMemo(() => {
    if (!parseResult?.draft.calendarId) {
      return null;
    }

    return (
      calendars.find((calendar) => calendar.id === parseResult.draft.calendarId)?.displayName ?? null
    );
  }, [calendars, parseResult]);

  const canOpenDraft = Boolean(parseResult?.draft.title.trim());
  const isDisabled = isLoading;

  const handleParse = () => {
    if (!input.trim()) {
      toast.error("Bitte gib zuerst einen Quick-Add-Text ein.");
      return;
    }

    const nextResult = parseQuickAddInput(input, {
      timezone,
      categories,
      locations,
      templates,
      calendars,
    });

    setParseResult(nextResult);
  };

  const handleOpenDraft = () => {
    if (!parseResult) {
      return;
    }

    if (!canOpenDraft) {
      toast.error("Der Entwurf braucht mindestens einen Titel.");
      return;
    }

    storeQuickAddDraft(parseResult.draft);
    router.push("/events/new?quickAdd=1");
  };

  return (
    <Card className={cn("card-shadow border-white/70 bg-card/90", className)}>
      <CardHeader className={compact ? "pb-3" : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              <span>{title}</span>
            </CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Beispiel: Mathe morgen 18 Uhr 2h
          </p>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact ? "pt-0" : "")}>
        <form
          className="flex flex-col gap-3 lg:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            handleParse();
          }}
        >
          <Input
            data-quick-add-input="true"
            disabled={Boolean(isDisabled)}
            onChange={(event) => setInput(event.target.value)}
            placeholder="z. B. Deadline Einsendeaufgabe Freitag 23:59"
            ref={inputRef}
            value={input}
          />
          <div className="flex gap-2">
            <Button disabled={Boolean(isDisabled)} type="submit" variant="outline">
              Vorschau
            </Button>
            <Button disabled={Boolean(isDisabled || !parseResult || !canOpenDraft)} onClick={handleOpenDraft} type="button">
              Formular öffnen
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>

        {metaWarning ? (
          <div className="rounded-2xl border border-warning/15 bg-warning/5 px-4 py-3 text-sm text-foreground">
            {metaWarning}
          </div>
        ) : null}

        {parseResult ? (
          <div className="space-y-3 rounded-[1.4rem] border border-border bg-white/75 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {parseResult.draft.title || "Titel bitte im Formular prüfen"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {parseResult.draft.allDay
                    ? `${parseResult.draft.startDate}${
                        parseResult.draft.endDate !== parseResult.draft.startDate
                          ? ` bis ${parseResult.draft.endDate}`
                          : ""
                      } · Ganztägig`
                    : `${parseResult.draft.startDate} ${parseResult.draft.startTime ?? ""} bis ${parseResult.draft.endDate} ${parseResult.draft.endTime ?? ""}`}
                </p>
              </div>
              {parseResult.draft.category ? (
                <p className="rounded-full bg-black/[0.045] px-3 py-1 text-xs text-foreground">
                  {parseResult.draft.category}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>Kalender: {resolvedCalendarName ?? "Standardauswahl im Formular"}</p>
              <p>Standort: {parseResult.draft.location || "Kein Standort erkannt"}</p>
              <p>Vorlage: {parseResult.matched.templateName ?? "Keine Vorlage erkannt"}</p>
              <p>Kategorie: {parseResult.matched.categoryName ?? "Keine Kategorie erkannt"}</p>
            </div>

            {parseResult.warnings.length > 0 ? (
              <div className="rounded-2xl border border-warning/15 bg-warning/5 px-4 py-3 text-sm text-foreground">
                {parseResult.warnings.map((warning, index) => (
                  <p key={`${warning}-${index}`}>{warning}</p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
