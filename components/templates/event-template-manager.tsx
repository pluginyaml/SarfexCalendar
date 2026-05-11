"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { requestJson } from "@/lib/http-client";
import type {
  CategoryRecord,
  EventTemplateRecord,
  LocationTemplateRecord,
} from "@/types/entities";
import { EventTemplateForm } from "@/components/templates/event-template-form";
import { EventTemplateList } from "@/components/templates/event-template-list";

export function EventTemplateManager() {
  const [templates, setTemplates] = useState<EventTemplateRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [locations, setLocations] = useState<LocationTemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null;

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [templateResult, categoryResult, locationResult] = await Promise.all([
        requestJson<EventTemplateRecord[]>("/api/templates"),
        requestJson<CategoryRecord[]>("/api/categories"),
        requestJson<LocationTemplateRecord[]>("/api/locations"),
      ]);

      setTemplates(templateResult);
      setCategories(categoryResult.filter((category) => category.isActive));
      setLocations(locationResult.filter((location) => location.isActive));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Vorlagen konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [templateResult, categoryResult, locationResult] = await Promise.all([
          requestJson<EventTemplateRecord[]>("/api/templates"),
          requestJson<CategoryRecord[]>("/api/categories"),
          requestJson<LocationTemplateRecord[]>("/api/locations"),
        ]);

        if (!isMounted) {
          return;
        }

        setTemplates(templateResult);
        setCategories(categoryResult.filter((category) => category.isActive));
        setLocations(locationResult.filter((location) => location.isActive));
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Vorlagen konnten nicht geladen werden.");
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
    titleTemplate: string;
    categoryId: string;
    locationTemplateId: string | null;
    defaultDurationMinutes: number;
    defaultDescription: string | null;
    defaultReminderMinutes: number[];
    isAllDayDefault: boolean;
    isActive: boolean;
  }) => {
    setIsSaving(true);

    try {
      const template = selectedTemplate
        ? await requestJson<EventTemplateRecord>(`/api/templates/${selectedTemplate.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await requestJson<EventTemplateRecord>("/api/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      toast.success(selectedTemplate ? "Vorlage aktualisiert." : "Vorlage angelegt.");
      setSelectedTemplateId(template.id);
      await loadData();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: EventTemplateRecord) => {
    const confirmed = window.confirm(`Vorlage "${template.name}" wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      await requestJson<{ id: string }>(`/api/templates/${template.id}`, {
        method: "DELETE",
      });
      toast.success("Vorlage gelöscht.");
      setSelectedTemplateId(null);
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Loeschen fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-8 text-sm text-muted-foreground">Vorlagen werden geladen...</div>;
  }

  if (error) {
    return <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-8 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <EventTemplateList
        onCreate={() => setSelectedTemplateId(null)}
        onSelect={(template) => setSelectedTemplateId(template.id)}
        selectedTemplateId={selectedTemplateId}
        templates={templates}
      />
      <EventTemplateForm
        categories={categories}
        isSaving={isSaving}
        locations={locations}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        template={selectedTemplate}
      />
    </div>
  );
}
