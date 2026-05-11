"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { LocationTemplateRecord } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type LocationTemplateFormValues = {
  name: string;
  address: string;
  link: string;
  notes: string;
  defaultDescription: string;
  isActive: boolean;
};

type LocationTemplateFormProps = {
  location: LocationTemplateRecord | null;
  isSaving: boolean;
  onDelete: (location: LocationTemplateRecord) => void;
  onSubmit: (values: {
    name: string;
    address: string;
    link: string | null;
    notes: string | null;
    defaultDescription: string | null;
    isActive: boolean;
  }) => Promise<void>;
};

function toFormValues(location: LocationTemplateRecord | null): LocationTemplateFormValues {
  if (!location) {
    return {
      name: "",
      address: "",
      link: "",
      notes: "",
      defaultDescription: "",
      isActive: true,
    };
  }

  return {
    name: location.name,
    address: location.address,
    link: location.link ?? "",
    notes: location.notes ?? "",
    defaultDescription: location.defaultDescription ?? "",
    isActive: location.isActive,
  };
}

export function LocationTemplateForm({
  location,
  isSaving,
  onDelete,
  onSubmit,
}: LocationTemplateFormProps) {
  const form = useForm<LocationTemplateFormValues>({
    defaultValues: toFormValues(location),
  });

  useEffect(() => {
    form.reset(toFormValues(location));
  }, [form, location]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      address: values.address.trim(),
      link: values.link.trim() || null,
      notes: values.notes.trim() || null,
      defaultDescription: values.defaultDescription.trim() || null,
      isActive: values.isActive,
    });
  });

  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader>
        <CardTitle>{location ? "Standort bearbeiten" : "Neuer Standort"}</CardTitle>
        <CardDescription>
          Adressen werden später nach LOCATION übernommen, Beschreibung und Link können in DESCRIPTION einfließen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="location-name">Name</Label>
            <Input id="location-name" required {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-address">Adresse</Label>
            <Textarea id="location-address" required {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-link">Link</Label>
            <Input id="location-link" placeholder="https://..." {...form.register("link")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-notes">Notiz</Label>
            <Textarea id="location-notes" {...form.register("notes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-default-description">Standardbeschreibung</Label>
            <Textarea id="location-default-description" {...form.register("defaultDescription")} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 px-4 py-3">
            <div>
              <p className="font-medium">Aktiv</p>
              <p className="text-sm text-muted-foreground">Inaktive Standorte bleiben dokumentiert.</p>
            </div>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {location ? (
              <Button onClick={() => onDelete(location)} type="button" variant="outline">
                Löschen
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Neue Standorte stehen nach dem Speichern sofort in Formularen bereit.
              </span>
            )}
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Speichert..." : location ? "Standort speichern" : "Standort anlegen"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
