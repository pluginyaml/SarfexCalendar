"use client";

import { PencilLine, Plus } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatReminderMinutes } from "@/lib/reminders";
import type { CategoryRecord } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CategoryListProps = {
  categories: CategoryRecord[];
  selectedCategoryId: string | null;
  onCreate: () => void;
  onSelect: (category: CategoryRecord) => void;
};

export function CategoryList({
  categories,
  selectedCategoryId,
  onCreate,
  onSelect,
}: CategoryListProps) {
  return (
    <Card className="card-shadow border-white/70 bg-card/90">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Kategorien</CardTitle>
          <CardDescription>Lokale Metadaten mit Farben, Icons und Standardwerten.</CardDescription>
        </div>
        <Button onClick={onCreate} size="sm" type="button" variant="secondary">
          <Plus className="size-4" />
          Neu
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Noch keine Kategorien vorhanden.
          </div>
        ) : (
          categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);

            return (
              <button
                key={category.id}
                className={cn(
                  "flex w-full flex-col rounded-[1.5rem] border px-4 py-4 text-left transition-colors",
                  category.id === selectedCategoryId
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white/70 hover:bg-secondary/50",
                )}
                onClick={() => onSelect(category)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-11 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.defaultDurationMinutes} Min, {formatReminderMinutes(category.defaultReminderMinutes)}
                      </p>
                    </div>
                  </div>
                  <PencilLine className="mt-1 size-4 text-muted-foreground" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={category.isActive ? "default" : "outline"}>
                    {category.isActive ? "Aktiv" : "Inaktiv"}
                  </Badge>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Sortierung {category.sortOrder}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
