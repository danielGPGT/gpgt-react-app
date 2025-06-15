import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketTable } from "@/components/ui/ticketTable";
import HotelsWithRooms from "@/components/ui/HotelsWithRooms";
import { LoungePassTable } from "@/components/ui/LoungePassTable";
import { AirportTransferTable } from "@/components/ui/airportTransferTable";
import CircuitTransferTable from "@/components/ui/circuitTransferTable";
import TestHotelRooms from "@/components/ui/testhotelRooms";
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
      <Tabs value={defaultTab} className="" onValueChange={onTabChange}>
        <TabsList className="flex flex-wrap gap-4">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Hotels & Rooms
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
          <TestHotelRooms />
        </TabsContent>

        <TabsContent value="circuits" className="mt-6">
          <CircuitTransferTable />
        </TabsContent>

        <TabsContent value="airport" className="mt-6">
          <AirportTransferTable />
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
          <LoungePassTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { Inventory };
