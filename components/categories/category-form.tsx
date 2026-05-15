"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { categoryIconOptions } from "@/lib/category-icons";
import { parseReminderInput, remindersToInputString } from "@/lib/reminders";
import type { CategoryRecord } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPickerPopover } from "@/components/ui/color-picker-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type CategoryFormValues = {
  name: string;
  color: string;
  icon: string;
  defaultDurationMinutes: number;
  defaultReminderInput: string;
  sortOrder: number;
  isActive: boolean;
};

type CategoryFormProps = {
  category: CategoryRecord | null;
  nextSortOrder: number;
  isSaving: boolean;
  onDelete: (category: CategoryRecord) => void;
  onSubmit: (values: {
    name: string;
    color: string;
    icon: string;
    defaultDurationMinutes: number;
    defaultReminderMinutes: number[];
    sortOrder: number;
    isActive: boolean;
  }) => Promise<void>;
};

const DEFAULT_COLOR = "#2563EB";

function toFormValues(category: CategoryRecord | null, nextSortOrder: number): CategoryFormValues {
  if (!category) {
    return {
      name: "",
      color: DEFAULT_COLOR,
      icon: "Calendar",
      defaultDurationMinutes: 60,
      defaultReminderInput: "60",
      sortOrder: nextSortOrder,
      isActive: true,
    };
  }

  return {
    name: category.name,
    color: category.color,
    icon: category.icon,
    defaultDurationMinutes: category.defaultDurationMinutes,
    defaultReminderInput: remindersToInputString(category.defaultReminderMinutes),
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

export function CategoryForm({
  category,
  nextSortOrder,
  isSaving,
  onDelete,
  onSubmit,
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    defaultValues: toFormValues(category, nextSortOrder),
  });

  useEffect(() => {
    form.reset(toFormValues(category, nextSortOrder));
  }, [category, form, nextSortOrder]);

  const selectedIcon = useWatch({
    control: form.control,
    name: "icon",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      name: values.name.trim(),
      color: values.color,
      icon: values.icon,
      defaultDurationMinutes: Number(values.defaultDurationMinutes),
      defaultReminderMinutes: parseReminderInput(values.defaultReminderInput),
      sortOrder: Number(values.sortOrder),
      isActive: values.isActive,
    });
  });

  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader>
        <CardTitle>{category ? "Kategorie bearbeiten" : "Neue Kategorie"}</CardTitle>
        <CardDescription>Farben, Icons und Standards für neue Termine.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input id="category-name" required {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Farbe</Label>
              <Controller
                control={form.control}
                name="color"
                render={({ field }) => (
                  <ColorPickerPopover
                    onChange={(value) => field.onChange(value ?? DEFAULT_COLOR)}
                    value={field.value}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {categoryIconOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedIcon === option.value;

                return (
                  <button
                    className={`flex items-center gap-3 rounded-[1rem] border px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-white/70 text-foreground hover:bg-secondary/40"
                    }`}
                    key={option.value}
                    onClick={() => form.setValue("icon", option.value, { shouldDirty: true })}
                    type="button"
                  >
                    <span
                      className={`inline-flex size-9 items-center justify-center rounded-[0.85rem] ${
                        isSelected ? "bg-background/15" : "bg-black/[0.04]"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category-sort-order">Sortierung</Label>
              <Input
                id="category-sort-order"
                min={0}
                required
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-duration">Standarddauer in Minuten</Label>
              <Input
                id="category-duration"
                min={1}
                required
                type="number"
                {...form.register("defaultDurationMinutes", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-reminders">Erinnerungen in Minuten</Label>
            <Input
              id="category-reminders"
              placeholder="10080, 1440, 120"
              {...form.register("defaultReminderInput")}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 px-4 py-3">
            <div>
              <p className="font-medium">Aktiv</p>
              <p className="text-sm text-muted-foreground">Inaktive Kategorien bleiben erhalten.</p>
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
            {category ? (
              <Button onClick={() => onDelete(category)} type="button" variant="outline">
                Löschen
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Neue Kategorien werden lokal gespeichert.
              </span>
            )}
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Speichert..." : category ? "Kategorie speichern" : "Kategorie anlegen"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
