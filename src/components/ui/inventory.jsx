import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketTable } from "@/components/ui/ticketTable";
import { RoomsTable } from "@/components/ui/roomsTable";
import { HotelsTable } from "@/components/ui/hotelsTable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Ticket, Bed, Bus, Plane, Coffee, Hotel } from "lucide-react";

function Inventory({ defaultTab = "tickets", onTabChange }) {
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue={defaultTab} className="" onValueChange={onTabChange}>
        <TabsList className="flex flex-wrap gap-4">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Bed className="h-4 w-4" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="circuits" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Circuit Transfers
          </TabsTrigger>
          <TabsTrigger value="airport" className="flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Airport Transfers
          </TabsTrigger>
          <TabsTrigger value="lounge" className="flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Lounge Passes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          <TicketTable />
        </TabsContent>

        <TabsContent value="hotels" className="mt-6">
          <HotelsTable />
        </TabsContent>

        <TabsContent value="rooms" className="mt-6">
          <RoomsTable />
        </TabsContent>

        <TabsContent value="circuits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Transfer Inventory</CardTitle>
              <CardDescription>
                Manage circuit transfer inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Circuit transfer inventory management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="airport" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Airport Transfer Inventory</CardTitle>
              <CardDescription>
                Manage airport transfer inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Airport transfer inventory management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flights" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Flight Inventory</CardTitle>
              <CardDescription>Manage flight inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Flight inventory management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lounge" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lounge Pass Inventory</CardTitle>
              <CardDescription>Manage lounge pass inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Lounge pass inventory management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { Inventory };
