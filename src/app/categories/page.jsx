import { CategoriesTable } from "@/components/ui/categoriesTable";

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Categories</h1>
        </div>
        <CategoriesTable />
      </div>
    </div>
  );
} 