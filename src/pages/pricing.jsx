import { useState, useEffect } from "react";
import { BadgePoundSterling } from "lucide-react";
import { AppHeader } from "@/components/ui/app-header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { CombinedPricing } from "@/components/ui/combinedPricing";
import api from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function Pricing() {
  const [role, setRole] = useState("");
  const [numberOfAdults, setNumberOfAdults] = useState(2);
  const [selectedCurrency, setSelectedCurrency] = useState("GBP");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedLoungePass, setSelectedLoungePass] = useState(null);
  const [selectedCircuitTransfer, setSelectedCircuitTransfer] = useState(null);
  const [selectedAirportTransfer, setSelectedAirportTransfer] = useState(null);
  const [roomQuantity, setRoomQuantity] = useState(1);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [loungePassQuantity, setLoungePassQuantity] = useState(1);
  const [circuitTransferQuantity, setCircuitTransferQuantity] = useState(1);
  const [airportTransferQuantity, setAirportTransferQuantity] = useState(1);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [originalNights, setOriginalNights] = useState(0);
  const [flightQuantity, setFlightQuantity] = useState(1);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        setRole(decoded.role);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }
    fetchCurrentUser();
  }, []);

  const handleTicketSelect = async (ticketId) => {
    if (ticketId === "none") {
      setSelectedTicket(null);
      setTicketQuantity(0);
      if (selectedCircuitTransfer) {
        setCircuitTransferQuantity(0);
      }
      return;
    }

    const foundTicket = tickets.find((ticket) => ticket.ticket_id === ticketId);
    if (foundTicket) {
      console.log('Selected Ticket:', foundTicket);
      
      try {
        // Fetch category using category_id
        const categoryRes = await api.get("/categories", {
          params: { 
            categoryId: foundTicket.category_id
          }
        });
        
        console.log('Category Response:', categoryRes.data);
        
        if (categoryRes.data && categoryRes.data.length > 0) {
          // Find the correct category by category_id
          const matchedCategory = categoryRes.data.find(cat => cat.category_id === foundTicket.category_id);
          if (matchedCategory) {
            console.log('Found Category:', matchedCategory);
            const ticketWithCategory = {
              ...foundTicket,
              category: {
                ...matchedCategory,
                category_name: matchedCategory.category_name || matchedCategory.gpgt_category_name,
                video_wall: matchedCategory.video_wall || false,
                covered_seat: matchedCategory.covered_seat || false,
                numbered_seat: matchedCategory.numbered_seat || false,
                category_info: matchedCategory.category_info || '',
                ticket_delivery_days: matchedCategory.ticket_delivery_days || 0,
                ticket_image_1: matchedCategory.ticket_image_1 || '',
                ticket_image_2: matchedCategory.ticket_image_2 || ''
              }
            };
            console.log('Ticket with Category:', ticketWithCategory);
            setSelectedTicket(ticketWithCategory);
            setTicketQuantity(numberOfAdults);
            if (selectedCircuitTransfer) {
              setCircuitTransferQuantity(numberOfAdults);
            }
          } else {
            console.warn('No matching category found for ticket:', foundTicket);
            setSelectedTicket(foundTicket);
            setTicketQuantity(numberOfAdults);
            if (selectedCircuitTransfer) {
              setCircuitTransferQuantity(numberOfAdults);
            }
          }
        } else {
          console.warn('No category found for ticket:', foundTicket);
          setSelectedTicket(foundTicket);
          setTicketQuantity(numberOfAdults);
          if (selectedCircuitTransfer) {
            setCircuitTransferQuantity(numberOfAdults);
          }
        }
      } catch (error) {
        console.error('Failed to fetch category:', error);
        // Still set the ticket even if category fetch fails
        setSelectedTicket(foundTicket);
        setTicketQuantity(numberOfAdults);
        if (selectedCircuitTransfer) {
          setCircuitTransferQuantity(numberOfAdults);
        }
      }
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="p-8">
          <AppHeader className="mb-6" />

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <BadgePoundSterling className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                GPGT's Pricing
              </h2>
            </div>
          </div>

          <div className="flex w-full justify-between mt-4 gap-6">
            <CombinedPricing
              numberOfAdults={numberOfAdults}
              setNumberOfAdults={setNumberOfAdults}
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
              selectedPackage={selectedPackage}
              setSelectedPackage={setSelectedPackage}
              selectedHotel={selectedHotel}
              setSelectedHotel={setSelectedHotel}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              selectedFlight={selectedFlight}
              setSelectedFlight={setSelectedFlight}
              selectedLoungePass={selectedLoungePass}
              setSelectedLoungePass={setSelectedLoungePass}
              selectedCircuitTransfer={selectedCircuitTransfer}
              setSelectedCircuitTransfer={setSelectedCircuitTransfer}
              selectedAirportTransfer={selectedAirportTransfer}
              setSelectedAirportTransfer={setSelectedAirportTransfer}
              roomQuantity={roomQuantity}
              setRoomQuantity={setRoomQuantity}
              ticketQuantity={ticketQuantity}
              setTicketQuantity={setTicketQuantity}
              loungePassQuantity={loungePassQuantity}
              setLoungePassQuantity={setLoungePassQuantity}
              circuitTransferQuantity={circuitTransferQuantity}
              setCircuitTransferQuantity={setCircuitTransferQuantity}
              airportTransferQuantity={airportTransferQuantity}
              setAirportTransferQuantity={setAirportTransferQuantity}
              dateRange={dateRange}
              setDateRange={setDateRange}
              originalNights={originalNights}
              setOriginalNights={setOriginalNights}
              flightQuantity={flightQuantity}
              setFlightQuantity={setFlightQuantity}
              userRole={role}
            />
          </div>

          {/* Ticket Info Dialog */}
          <Dialog open={showTicketInfo} onOpenChange={setShowTicketInfo}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ticket Information</DialogTitle>
                <DialogDescription>
                  Detailed information about the selected ticket
                </DialogDescription>
              </DialogHeader>
              {selectedTicket && (
                <div className="space-y-6">
                  {/* Ticket Information */}
                  <div>
                    <h3 className="font-semibold text-base text-primary mb-1 border-b border-muted pb-1 text-left">Ticket Information</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <p className="font-medium text-foreground">Ticket Type:</p>
                      <p>{selectedTicket.ticket_type}</p>
                      <p className="font-medium text-foreground">Event Days:</p>
                      <p>{selectedTicket.event_days}</p>
                      <p className="font-medium text-foreground">Available:</p>
                      <p>{selectedTicket.remaining === "purchased_to_order" ? "Purchased to Order" : `${selectedTicket.remaining} tickets left`}</p>
                    </div>
                  </div>

                  {/* Category Information */}
                  {selectedTicket.category && (
                    <div>
                      <h3 className="font-semibold text-base text-primary mb-1 border-b border-muted pb-1 text-left">Category Information</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <p className="font-medium text-foreground">Category Name:</p>
                        <p>{selectedTicket.category.category_name}</p>
                        <p className="font-medium text-foreground">Package Type:</p>
                        <p>{selectedTicket.category.package_type}</p>
                        <p className="font-medium text-foreground">Delivery Days:</p>
                        <p>{selectedTicket.category.ticket_delivery_days} days</p>
                      </div>
                      
                      {/* Additional Info */}
                      {selectedTicket.category.category_info && (
                        <div className="mt-6">
                          <h4 className="font-medium text-foreground mb-1">Additional Information:</h4>
                          <p className="text-sm text-muted-foreground">{selectedTicket.category.category_info}</p>
                        </div>
                      )}

                      {/* Features */}
                      <div className="mt-6">
                        <h4 className="font-medium text-foreground mb-2">Features:</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${selectedTicket.category.video_wall ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">Video Wall</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${selectedTicket.category.covered_seat ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">Covered Seat</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${selectedTicket.category.numbered_seat ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm">Numbered Seat</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </SidebarProvider>
  );
}

export default Pricing; 