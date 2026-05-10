"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EventFiltersProps = {
  search: string;
  category: string;
  location: string;
  categories: string[];
  locations: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
};

export function EventFilters({
  search,
  category,
  location,
  categories,
  locations,
  onSearchChange,
  onCategoryChange,
  onLocationChange,
}: EventFiltersProps) {
  return (
    <div className="grid gap-4 rounded-[1.75rem] border border-white/70 bg-card/90 p-5 md:grid-cols-[1.5fr_1fr_1fr]">
      <div className="space-y-2">
        <Label htmlFor="event-search">Suche</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="event-search"
            className="pl-10"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Titel, Beschreibung, Ort"
            value={search}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Kategorie</Label>
        <Select onValueChange={onCategoryChange} value={category}>
          <SelectTrigger>
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Standort</Label>
        <Select onValueChange={onLocationChange} value={location}>
          <SelectTrigger>
            <SelectValue placeholder="Alle Standorte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Standorte</SelectItem>
            {locations.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
