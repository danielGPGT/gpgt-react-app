import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketTable } from "@/components/ui/ticketTable";
import { RoomsTable } from "@/components/ui/roomsTable";
import { HotelsTable } from "@/components/ui/hotelsTable";
import { PackagesTable } from "@/components/ui/packagesTable";
import { TiersTable } from "@/components/ui/tiersTable";
import { EventsTable } from "@/components/ui/eventsTable";
import { CategoriesTable } from "@/components/ui/categoriesTable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Package, Layers, CalendarDays, CalendarCog, Ticket } from "lucide-react";

function PackagesTiers({ defaultTab = "events", onTabChange }) {
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue={defaultTab} className="" onValueChange={onTabChange}>
        <TabsList className="flex flex-wrap gap-4">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Package Tiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <EventsTable />
        </TabsContent>

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
