"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { requestJson } from "@/lib/http-client";
import type { DefaultView, UiSettingsRecord } from "@/types/entities";
import type { CalDavConnectionResult } from "@/lib/caldav";
import { CalDavStatusCard } from "@/components/settings/caldav-status-card";
import { ConnectionTestButton } from "@/components/settings/connection-test-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SettingsFormValues = {
  defaultView: DefaultView;
  weekStartsOn: number;
  timezone: string;
};

const weekOptions = [
  { value: "1", label: "Montag" },
  { value: "0", label: "Sonntag" },
  { value: "2", label: "Dienstag" },
  { value: "3", label: "Mittwoch" },
  { value: "4", label: "Donnerstag" },
  { value: "5", label: "Freitag" },
  { value: "6", label: "Samstag" },
] as const;

export function SettingsManager() {
  const [settings, setSettings] = useState<UiSettingsRecord | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"pending" | "success" | "error">(
    "pending",
  );
  const [connectionMessage, setConnectionMessage] = useState(
    "Noch kein Live-Verbindungstest ausgefuehrt",
  );
  const [connectionDetail, setConnectionDetail] = useState(
    "Die Verbindung zu Nextcloud laesst sich hier direkt gegen den konfigurierten CalDAV-Kalender pruefen.",
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    defaultValues: {
      defaultView: "week",
      weekStartsOn: 1,
      timezone: "Europe/Berlin",
    },
  });

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const result = await requestJson<UiSettingsRecord>("/api/settings");

        if (!isMounted) {
          return;
        }

        setSettings(result);
        form.reset({
          defaultView: result.defaultView,
          weekStartsOn: result.weekStartsOn,
          timezone: result.timezone,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Einstellungen konnten nicht geladen werden.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);

    try {
      const result = await requestJson<UiSettingsRecord>("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      setSettings(result);
      form.reset({
        defaultView: result.defaultView,
        weekStartsOn: result.weekStartsOn,
        timezone: result.timezone,
      });
      toast.success("Einstellungen gespeichert.");
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  });

  const handleConnectionTest = async () => {
    setIsTestingConnection(true);

    try {
      const result = await requestJson<CalDavConnectionResult>("/api/caldav/test", {
        method: "POST",
      });

      setConnectionStatus("success");
      setConnectionMessage(result.message);
      setConnectionDetail(result.calendarUrl);
      toast.success("CalDAV-Verbindung erfolgreich getestet.");
    } catch (testError) {
      const message =
        testError instanceof Error
          ? testError.message
          : "CalDAV-Verbindung konnte nicht geprueft werden.";

      setConnectionStatus("error");
      setConnectionMessage("Verbindungstest fehlgeschlagen");
      setConnectionDetail(message);
      toast.error(message);
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-8 text-sm text-muted-foreground">Einstellungen werden geladen...</div>;
  }

  if (error) {
    return <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-8 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <CalDavStatusCard
        detail={connectionDetail}
        message={connectionMessage}
        status={connectionStatus}
        actions={
          <ConnectionTestButton
            isPending={isTestingConnection}
            onClick={handleConnectionTest}
          />
        }
      />

      <Card className="card-shadow border-white/70 bg-card/90">
        <CardHeader>
          <CardTitle>UI-Einstellungen</CardTitle>
          <CardDescription>Diese Daten werden lokal gespeichert und beeinflussen spaeter die Kalenderansichten.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Standardansicht</Label>
              <Controller
                control={form.control}
                name="defaultView"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ansicht waehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Tag</SelectItem>
                      <SelectItem value="week">Woche</SelectItem>
                      <SelectItem value="month">Monat</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Wochenstart</Label>
              <Controller
                control={form.control}
                name="weekStartsOn"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tag waehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Zeitzone</Label>
              <Input id="timezone" required {...form.register("timezone")} />
            </div>
            <div className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-muted-foreground">
              Letztes Laden: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString("de-DE") : "Noch nie"}
            </div>
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Speichert..." : "Einstellungen speichern"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
