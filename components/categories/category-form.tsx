"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { categoryIconOptions } from "@/lib/category-icons";
import { parseReminderInput, remindersToInputString } from "@/lib/reminders";
import type { CategoryRecord } from "@/types/entities";
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

const defaultColor = "#2563EB";

function toFormValues(category: CategoryRecord | null, nextSortOrder: number): CategoryFormValues {
  if (!category) {
    return {
      name: "",
      color: defaultColor,
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
        <CardDescription>
          Farben, Icons und Standard-Erinnerungen bestimmen spaeter die Event-Darstellung.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input id="category-name" required {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-color">Farbe</Label>
              <Input id="category-color" required type="color" {...form.register("color")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Controller
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Icon waehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryIconOptions.map((option) => (
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
              <Label htmlFor="category-sort-order">Sortierung</Label>
              <Input
                id="category-sort-order"
                min={0}
                required
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="category-reminders">Erinnerungen in Minuten</Label>
              <Input
                id="category-reminders"
                placeholder="10080, 1440, 120"
                {...form.register("defaultReminderInput")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-white/70 px-4 py-3">
            <div>
              <p className="font-medium">Aktiv</p>
              <p className="text-sm text-muted-foreground">
                Inaktive Kategorien bleiben erhalten, werden aber spaeter im Formular abgewertet.
              </p>
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
                Loeschen
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Neue Kategorien werden direkt in PostgreSQL gespeichert.
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
