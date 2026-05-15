"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { requestJson } from "@/lib/http-client";
import type { CategoryRecord } from "@/types/entities";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";

export function CategoryManager() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;

  const nextSortOrder = useMemo(() => {
    if (categories.length === 0) {
      return 1;
    }

    return Math.max(...categories.map((category) => category.sortOrder)) + 1;
  }, [categories]);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestJson<CategoryRecord[]>("/api/categories");
      setCategories(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kategorien konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const result = await requestJson<CategoryRecord[]>("/api/categories");

        if (!isMounted) {
          return;
        }

        setCategories(result);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Kategorien konnten nicht geladen werden.");
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

  const handleSubmit = async (payload: {
    name: string;
    color: string;
    icon: string;
    defaultDurationMinutes: number;
    defaultReminderMinutes: number[];
    sortOrder: number;
    isActive: boolean;
  }) => {
    setIsSaving(true);

    try {
      const category = selectedCategory
        ? await requestJson<CategoryRecord>(`/api/categories/${selectedCategory.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await requestJson<CategoryRecord>("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      toast.success(selectedCategory ? "Kategorie aktualisiert." : "Kategorie angelegt.");
      setSelectedCategoryId(category.id);
      await loadCategories();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: CategoryRecord) => {
    const confirmed = window.confirm(`Kategorie "${category.name}" wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      await requestJson<{ id: string }>(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      toast.success("Kategorie gelöscht.");
      setSelectedCategoryId(null);
      await loadCategories();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Löschen fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-8 text-sm text-muted-foreground">
        Kategorien werden geladen...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-8 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <CategoryList
        categories={categories}
        onCreate={() => setSelectedCategoryId(null)}
        onSelect={(category) => setSelectedCategoryId(category.id)}
        selectedCategoryId={selectedCategoryId}
      />
      <CategoryForm
        category={selectedCategory}
        isSaving={isSaving}
        nextSortOrder={nextSortOrder}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
