import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackagesTable } from "@/components/ui/packagesTable";
import { TiersTable } from "@/components/ui/tiersTable";
import { Package, Layers } from "lucide-react";

function PackagesTiers({ defaultTab = "packages", onTabChange }) {
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue={defaultTab} className="" onValueChange={onTabChange}>
        <TabsList className="flex flex-wrap gap-4">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Package Tiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <PackagesTable />
        </TabsContent>

        <TabsContent value="tiers" className="mt-6">
          <TiersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { PackagesTiers };
