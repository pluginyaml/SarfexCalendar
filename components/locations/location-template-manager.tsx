"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { requestJson } from "@/lib/http-client";
import type { LocationTemplateRecord } from "@/types/entities";
import { LocationTemplateForm } from "@/components/locations/location-template-form";
import { LocationTemplateList } from "@/components/locations/location-template-list";

export function LocationTemplateManager() {
  const [locations, setLocations] = useState<LocationTemplateRecord[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ?? null;

  const loadLocations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await requestJson<LocationTemplateRecord[]>("/api/locations");
      setLocations(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Standorte konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const result = await requestJson<LocationTemplateRecord[]>("/api/locations");

        if (!isMounted) {
          return;
        }

        setLocations(result);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Standorte konnten nicht geladen werden.");
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
    address: string;
    link: string | null;
    notes: string | null;
    defaultDescription: string | null;
    isActive: boolean;
  }) => {
    setIsSaving(true);

    try {
      const location = selectedLocation
        ? await requestJson<LocationTemplateRecord>(`/api/locations/${selectedLocation.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await requestJson<LocationTemplateRecord>("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      toast.success(selectedLocation ? "Standort aktualisiert." : "Standort angelegt.");
      setSelectedLocationId(location.id);
      await loadLocations();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Speichern fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (location: LocationTemplateRecord) => {
    const confirmed = window.confirm(`Standort "${location.name}" wirklich löschen?`);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);

    try {
      await requestJson<{ id: string }>(`/api/locations/${location.id}`, {
        method: "DELETE",
      });
      toast.success("Standort gelöscht.");
      setSelectedLocationId(null);
      await loadLocations();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Loeschen fehlgeschlagen.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-[1.75rem] border border-white/70 bg-card/90 px-5 py-8 text-sm text-muted-foreground">Standorte werden geladen...</div>;
  }

  if (error) {
    return <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 px-5 py-8 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <LocationTemplateList
        locations={locations}
        onCreate={() => setSelectedLocationId(null)}
        onSelect={(location) => setSelectedLocationId(location.id)}
        selectedLocationId={selectedLocationId}
      />
      <LocationTemplateForm
        isSaving={isSaving}
        location={selectedLocation}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
