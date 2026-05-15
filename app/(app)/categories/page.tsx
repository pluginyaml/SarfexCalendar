import { Header } from "@/components/layout/header";
import { CategoryManager } from "@/components/categories/category-manager";

export const metadata = {
  title: "Kategorien",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <Header
        eyebrow="Kategorien"
        title="Farben, Icons und Standards"
        description="Lokale Metadaten für Terminfarben, Dauer und Erinnerungen."
      />
      <CategoryManager />
    </div>
  );
}
