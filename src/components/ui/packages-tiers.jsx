import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketTable } from "@/components/ui/ticketTable";
import { RoomsTable } from "@/components/ui/roomsTable";
import { HotelsTable } from "@/components/ui/hotelsTable";
import { PackagesTable } from "@/components/ui/packagesTable";
import { TiersTable } from "@/components/ui/tiersTable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Package, Layers } from "lucide-react";

function PackagesTiers() {
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
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
