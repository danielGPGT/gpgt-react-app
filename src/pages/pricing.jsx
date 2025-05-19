"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/ui/app-header";
import { InternalPricing } from "@/components/ui/internalPricing";
import { ExternalPricing } from "@/components/ui/externalPricing";
import { BookingForm } from "@/components/ui/bookingForm";
import { RequestBooking } from "@/components/ui/requestBooking";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { jwtDecode } from "jwt-decode"; // Import this
import api from "@/lib/api"; // Import your api
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";
import { BadgePoundSterling } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Add currency symbol mapping
const currencySymbols = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  AUD: "A$",
  CAD: "C$",
};

function PricingSheet() {
  const [numberOfAdults, setNumberOfAdults] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [role, setRole] = useState(""); // Track user role
  const [salesTeam, setSalesTeam] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedLoungePass, setSelectedLoungePass] = useState(null);
  const [roomQuantity, setRoomQuantity] = useState(1);
  const [ticketQuantity, setTicketQuantity] = useState(2);
  const [loungePassQuantity, setLoungePassQuantity] = useState(1);
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });
  const [originalNights, setOriginalNights] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("GBP"); // Add currency state
  const [salesTeams, setSalesTeams] = useState([]);
  const [selectedCircuitTransfer, setSelectedCircuitTransfer] = useState(null);
  const [selectedAirportTransfer, setSelectedAirportTransfer] = useState(null);
  const [circuitTransferQuantity, setCircuitTransferQuantity] = useState(1);
  const [airportTransferQuantity, setAirportTransferQuantity] = useState(1);
  const [createFlightBooking, setCreateFlightBooking] = useState(false);
  const [flightPNR, setFlightPNR] = useState("");
  const [ticketingDeadline, setTicketingDeadline] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [createLoungeBooking, setCreateLoungeBooking] = useState(false);
  const [loungeBookingRef, setLoungeBookingRef] = useState("");
  const [flightQuantity, setFlightQuantity] = useState(0);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        setRole(decoded.role);
        // Set the current user as the consultant
        setSalesTeam({
          first_name: decoded.first_name,
          last_name: decoded.last_name
        });
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }
    fetchCurrentUser();
  }, []);

  const handleBookingSubmit = async (formData) => {
    try {
      // Format dates for the API
      const formatDate = (date) => {
        if (!date) return '';
        return format(new Date(date), "dd-LLL-y");
      };

      // Get payment dates from package or use current date for upfront payment
      const payment1Date = formatDate(new Date()); // Current date for upfront payment
      const payment2Date = selectedPackage?.payment_date_2 || '';
      const payment3Date = selectedPackage?.payment_date_3 || '';

      // Use the payment amounts directly from the form data
      const payment1Amount = formData.paymentAmounts[0];
      const payment2Amount = formData.paymentAmounts[1];
      const payment3Amount = formData.paymentAmounts[2];

      // Prepare the booking data according to API requirements
      const bookingData = {
        booker_name: formData.booker_name,
        booker_email: formData.booker_email,
        booker_phone: formData.booker_phone,
        booker_address: [
          formData.address_line_1,
          formData.address_line_2,
          formData.city,
          formData.postcode,
          formData.country
        ].filter(Boolean).join('\n'),
        lead_traveller_name: formData.lead_traveller_name,
        lead_traveller_email: formData.lead_traveller_email,
        lead_traveller_phone: formData.lead_traveller_phone,
        booking_date: formatDate(formData.booking_date),
        event_id: selectedEvent?.event_id || '',
        package_id: selectedPackage?.package_id || '',
        ticket_id: selectedTicket?.ticket_id || '',
        ticket_quantity: ticketQuantity,
        ticket_price: selectedTicket ? selectedTicket.price * ticketQuantity : 0,
        hotel_id: selectedHotel?.hotel_id || '',
        room_id: selectedRoom?.room_id || '',
        room_quantity: roomQuantity,
        extra_nights: dateRange?.from && dateRange?.to ? 
          Math.max(differenceInCalendarDays(dateRange.to, dateRange.from) - originalNights, 0) : 0,
        room_price: selectedRoom ? 
          (Number(selectedRoom.price) + 
           (Math.max(differenceInCalendarDays(dateRange.to, dateRange.from) - originalNights, 0) * Number(selectedRoom.extra_night_price))) * 
          roomQuantity : 0,
        airport_transfer_id: selectedAirportTransfer?.airport_transfer_id || '',
        airport_transfer_quantity: airportTransferQuantity,
        airport_transfer_price: selectedAirportTransfer ? selectedAirportTransfer.price * airportTransferQuantity : 0,
        circuit_transfer_id: selectedCircuitTransfer?.circuit_transfer_id || '',
        circuit_transfer_quantity: circuitTransferQuantity,
        circuit_transfer_price: selectedCircuitTransfer ? selectedCircuitTransfer.price * circuitTransferQuantity : 0,
        flight_id: selectedFlight?.flight_id || '',
        flight_booking_reference: flightPNR || '',
        ticketing_deadline: formatDate(ticketingDeadline),
        flight_status: paymentStatus || '',
        flight_quantity: selectedFlight ? flightQuantity : 0,
        flight_price: selectedFlight ? selectedFlight.price * flightQuantity : 0,
        lounge_pass_id: selectedLoungePass?.lounge_pass_id || '',
        lounge_pass_quantity: loungePassQuantity,
        lounge_pass_price: selectedLoungePass ? selectedLoungePass.price * loungePassQuantity : 0,
        payment_currency: selectedCurrency,
        payment_1: payment1Amount,
        payment_1_date: payment1Date,
        payment_2: payment2Amount,
        payment_2_date: payment2Date,
        payment_3: payment3Amount,
        payment_3_date: payment3Date,
        guest_traveller_names: formData.guest_traveller_names.join(', '),
        acquisition: formData.acquisition,
        booking_type: formData.booking_type,
        atol_abtot: formData.atol_abtot,
        consultant: salesTeam ? `${salesTeam.first_name} ${salesTeam.last_name}` : '',
        check_in_date: dateRange?.from ? formatDate(dateRange.from) : '',
        check_out_date: dateRange?.to ? formatDate(dateRange.to) : '',
        nights: dateRange?.from && dateRange?.to ? 
          Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) : 0,
        adults: numberOfAdults
      };

      // Log the data being sent
      console.log('Sending booking data:', bookingData);

      // Make the API request
      const response = await api.post('/bookingFile', bookingData);
      
      // Show success message
      toast.success('Booking created successfully!');
      
      // Reset form and selections
      // You might want to add reset functions for your form and selections here
      
    } catch (error) {
      console.error('Failed to create booking:', error);
      
      // Log the error response data if available
      if (error.response?.data) {
        console.error('Server error response:', error.response.data);
      }
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
      toast.error(errorMessage);
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
            {/* Conditionally render based on role */}
            {["Internal Sales", "Operations"].includes(role) && (
              <div className="flex w-full justify-between mt-4 gap-6">
                <InternalPricing
                  numberOfAdults={numberOfAdults}
                  setNumberOfAdults={setNumberOfAdults}
                  totalPrice={totalPrice}
                  setTotalPrice={setTotalPrice}
                  selectedCurrency={selectedCurrency}
                  setSelectedCurrency={setSelectedCurrency}
                  createFlightBooking={createFlightBooking}
                  setCreateFlightBooking={setCreateFlightBooking}
                  flightPNR={flightPNR}
                  setFlightPNR={setFlightPNR}
                  ticketingDeadline={ticketingDeadline}
                  setTicketingDeadline={setTicketingDeadline}
                  paymentStatus={paymentStatus}
                  setPaymentStatus={setPaymentStatus}
                  createLoungeBooking={createLoungeBooking}
                  setCreateLoungeBooking={setCreateLoungeBooking}
                  loungeBookingRef={loungeBookingRef}
                  setLoungeBookingRef={setLoungeBookingRef}
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
                />
                <BookingForm
                  numberOfAdults={numberOfAdults}
                  totalPrice={totalPrice}
                  selectedCurrency={selectedCurrency}
                  dateRange={dateRange}
                  onSubmit={handleBookingSubmit}
                  selectedEvent={selectedEvent}
                  selectedPackage={selectedPackage}
                  selectedHotel={selectedHotel}
                  selectedRoom={selectedRoom}
                  selectedTicket={selectedTicket}
                  selectedFlight={selectedFlight}
                  selectedLoungePass={selectedLoungePass}
                  selectedCircuitTransfer={selectedCircuitTransfer}
                  selectedAirportTransfer={selectedAirportTransfer}
                  ticketQuantity={ticketQuantity}
                  roomQuantity={roomQuantity}
                  loungePassQuantity={loungePassQuantity}
                  circuitTransferQuantity={circuitTransferQuantity}
                  airportTransferQuantity={airportTransferQuantity}
                  flightQuantity={flightQuantity}
                  flightPNR={flightPNR}
                  ticketingDeadline={ticketingDeadline}
                  paymentStatus={paymentStatus}
                  originalNights={originalNights}
                  salesTeam={salesTeam}
                />
              </div>
            )}

            {/* Conditionally render based on role */}
            {role === "Admin" && (
              <div className="w-full">
                <Tabs defaultValue="internal" className="">
                  <TabsList className="flex gap-4">
                    <TabsTrigger value="internal">Internal Pricing</TabsTrigger>
                    <TabsTrigger value="external">External Pricing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="internal">
                    <div className="flex w-full justify-between gap-4 mt-1">
                      <InternalPricing
                        numberOfAdults={numberOfAdults}
                        setNumberOfAdults={setNumberOfAdults}
                        totalPrice={totalPrice}
                        setTotalPrice={setTotalPrice}
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
                        createFlightBooking={createFlightBooking}
                        setCreateFlightBooking={setCreateFlightBooking}
                        flightPNR={flightPNR}
                        setFlightPNR={setFlightPNR}
                        ticketingDeadline={ticketingDeadline}
                        setTicketingDeadline={setTicketingDeadline}
                        paymentStatus={paymentStatus}
                        setPaymentStatus={setPaymentStatus}
                        createLoungeBooking={createLoungeBooking}
                        setCreateLoungeBooking={setCreateLoungeBooking}
                        loungeBookingRef={loungeBookingRef}
                        setLoungeBookingRef={setLoungeBookingRef}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        originalNights={originalNights}
                        setOriginalNights={setOriginalNights}
                        flightQuantity={flightQuantity}
                        setFlightQuantity={setFlightQuantity}
                      />
                      <BookingForm
                        numberOfAdults={numberOfAdults}
                        totalPrice={totalPrice}
                        selectedCurrency={selectedCurrency}
                        dateRange={dateRange}
                        onSubmit={handleBookingSubmit}
                        selectedEvent={selectedEvent}
                        selectedPackage={selectedPackage}
                        selectedHotel={selectedHotel}
                        selectedRoom={selectedRoom}
                        selectedTicket={selectedTicket}
                        selectedFlight={selectedFlight}
                        selectedLoungePass={selectedLoungePass}
                        selectedCircuitTransfer={selectedCircuitTransfer}
                        selectedAirportTransfer={selectedAirportTransfer}
                        ticketQuantity={ticketQuantity}
                        roomQuantity={roomQuantity}
                        loungePassQuantity={loungePassQuantity}
                        circuitTransferQuantity={circuitTransferQuantity}
                        airportTransferQuantity={airportTransferQuantity}
                        flightQuantity={flightQuantity}
                        flightPNR={flightPNR}
                        ticketingDeadline={ticketingDeadline}
                        paymentStatus={paymentStatus}
                        originalNights={originalNights}
                        salesTeam={salesTeam}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="external">
                    <div className="flex w-full justify-between gap-4 mt-1">
                      <ExternalPricing
                        numberOfAdults={numberOfAdults}
                        setNumberOfAdults={setNumberOfAdults}
                        totalPrice={totalPrice}
                        setTotalPrice={setTotalPrice}
                        setSalesTeam={setSalesTeams}
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
                        circuitTransferQuantity={circuitTransferQuantity}
                        setCircuitTransferQuantity={setCircuitTransferQuantity}
                        airportTransferQuantity={airportTransferQuantity}
                        setAirportTransferQuantity={setAirportTransferQuantity}
                        roomQuantity={roomQuantity}
                        setRoomQuantity={setRoomQuantity}
                        ticketQuantity={ticketQuantity}
                        setTicketQuantity={setTicketQuantity}
                        loungePassQuantity={loungePassQuantity}
                        setLoungePassQuantity={setLoungePassQuantity}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        selectedCurrency={selectedCurrency}
                        setSelectedCurrency={setSelectedCurrency}
                      />
                      <div className="w-full max-w-2xl">
                        <div className="p-4 space-y-4 bg-card rounded-md border shadow-sm">
                          <h2 className="text-lg font-semibold text-foreground">Booking Summary</h2>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Event:</span>
                              <span className="font-medium">{selectedEvent?.event || "Not selected"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Package:</span>
                              <span className="font-medium">{selectedPackage?.package_name || "Not selected"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hotel:</span>
                              <span className="font-medium">{selectedHotel?.hotel_name || "Not selected"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Room:</span>
                              <span className="font-medium">
                                {selectedRoom ? `${selectedRoom.room_category} - ${selectedRoom.room_type}` : "Not selected"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ticket:</span>
                              <span className="font-medium">{selectedTicket?.ticket_name || "Not selected"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Flight:</span>
                              <span className="font-medium">
                                {selectedFlight ? `${selectedFlight.airline} - ${selectedFlight.class}` : "Not selected"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Price:</span>
                              <span className="font-medium">
                                {currencySymbols[selectedCurrency]}{Math.round(totalPrice).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => setShowRequestDialog(true)}
                          >
                            Request Booking
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                      <DialogContent className="max-w-6xl">
                        <DialogHeader>
                          <DialogTitle>Request Booking</DialogTitle>
                          <DialogDescription>
                            Fill out the form below to request a booking. Our sales team will process your request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-6 pt-6">
                          <div className="space-y-4">
                            <h3 className="font-semibold">Booking Summary</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Event:</span>
                                <span className="font-medium">{selectedEvent?.event || "Not selected"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Package:</span>
                                <span className="font-medium">{selectedPackage?.package_name || "Not selected"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Hotel:</span>
                                <span className="font-medium">{selectedHotel?.hotel_name || "Not selected"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Room:</span>
                                <span className="font-medium">
                                  {selectedRoom ? `${selectedRoom.room_category} - ${selectedRoom.room_type} x ${roomQuantity}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ticket:</span>
                                <span className="font-medium">{selectedTicket?.ticket_name || "Not selected"} x {ticketQuantity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Flight:</span>
                                <span className="font-medium">
                                  {selectedFlight ? `${selectedFlight.airline} - ${selectedFlight.class}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Price:</span>
                                <span className="font-medium">
                                  {currencySymbols[selectedCurrency]}{Math.round(totalPrice).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ScrollArea className="h-[600px] pr-4">
                            <RequestBooking
                              numberOfAdults={numberOfAdults}
                              totalPrice={totalPrice}
                              salesTeam={salesTeams[0]}
                              selectedEvent={selectedEvent}
                              selectedPackage={selectedPackage}
                              selectedHotel={selectedHotel}
                              selectedRoom={selectedRoom}
                              selectedTicket={selectedTicket}
                              selectedFlight={selectedFlight}
                              selectedLoungePass={selectedLoungePass}
                              selectedCircuitTransfer={selectedCircuitTransfer}
                              selectedAirportTransfer={selectedAirportTransfer}
                              circuitTransferQuantity={circuitTransferQuantity}
                              airportTransferQuantity={airportTransferQuantity}
                              roomQuantity={roomQuantity}
                              ticketQuantity={ticketQuantity}
                              loungePassQuantity={loungePassQuantity}
                              dateRange={dateRange}
                              selectedCurrency={selectedCurrency}
                            />
                          </ScrollArea>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {role === "External B2B" && (
              <div className="flex w-full justify-between mt-4 gap-6">
                <ExternalPricing
                  numberOfAdults={numberOfAdults}
                  setNumberOfAdults={setNumberOfAdults}
                  totalPrice={totalPrice}
                  setTotalPrice={setTotalPrice}
                  setSalesTeam={setSalesTeams}
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
                  circuitTransferQuantity={circuitTransferQuantity}
                  setCircuitTransferQuantity={setCircuitTransferQuantity}
                  airportTransferQuantity={airportTransferQuantity}
                  setAirportTransferQuantity={setAirportTransferQuantity}
                  roomQuantity={roomQuantity}
                  setRoomQuantity={setRoomQuantity}
                  ticketQuantity={ticketQuantity}
                  setTicketQuantity={setTicketQuantity}
                  loungePassQuantity={loungePassQuantity}
                  setLoungePassQuantity={setLoungePassQuantity}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  selectedCurrency={selectedCurrency}
                  setSelectedCurrency={setSelectedCurrency}
                />
                <div className="w-full max-w-2xl">
                  <div className="p-4 space-y-4 bg-card rounded-md border shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground">Booking Summary</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event:</span>
                        <span className="font-medium">{selectedEvent?.event || "Not selected"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Package:</span>
                        <span className="font-medium">{selectedPackage?.package_name || "Not selected"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hotel:</span>
                        <span className="font-medium">{selectedHotel?.hotel_name || "Not selected"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room:</span>
                        <span className="font-medium">
                          {selectedRoom ? `${selectedRoom.room_category} - ${selectedRoom.room_type}` : "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ticket:</span>
                        <span className="font-medium">{selectedTicket?.ticket_name || "Not selected"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Flight:</span>
                        <span className="font-medium">
                          {selectedFlight ? `${selectedFlight.airline} - ${selectedFlight.class}` : "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Price:</span>
                        <span className="font-medium">
                          {currencySymbols[selectedCurrency]}{Math.round(totalPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowRequestDialog(true)}
                    >
                      Request Booking
                    </Button>
                  </div>
                </div>

                <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                  <DialogContent className="max-w-6xl">
                    <DialogHeader>
                      <DialogTitle>Request Booking</DialogTitle>
                      <DialogDescription>
                        Fill out the form below to request a booking. Our sales team will process your request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Booking Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Event:</span>
                            <span className="font-medium">{selectedEvent?.event || "Not selected"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Package:</span>
                            <span className="font-medium">{selectedPackage?.package_name || "Not selected"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Hotel:</span>
                            <span className="font-medium">{selectedHotel?.hotel_name || "Not selected"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Room:</span>
                            <span className="font-medium">
                              {selectedRoom ? `${selectedRoom.room_category} - ${selectedRoom.room_type}` : "Not selected"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ticket:</span>
                            <span className="font-medium">{selectedTicket?.ticket_name || "Not selected"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Flight:</span>
                            <span className="font-medium">
                              {selectedFlight ? `${selectedFlight.airline} - ${selectedFlight.class}` : "Not selected"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Price:</span>
                            <span className="font-medium">
                              {currencySymbols[selectedCurrency]}{Math.round(totalPrice).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ScrollArea className="h-[600px] pr-4">
                        <RequestBooking
                          numberOfAdults={numberOfAdults}
                          totalPrice={totalPrice}
                          salesTeam={salesTeams[0]}
                          selectedEvent={selectedEvent}
                          selectedPackage={selectedPackage}
                          selectedHotel={selectedHotel}
                          selectedRoom={selectedRoom}
                          selectedTicket={selectedTicket}
                          selectedFlight={selectedFlight}
                          selectedLoungePass={selectedLoungePass}
                          selectedCircuitTransfer={selectedCircuitTransfer}
                          selectedAirportTransfer={selectedAirportTransfer}
                          circuitTransferQuantity={circuitTransferQuantity}
                          airportTransferQuantity={airportTransferQuantity}
                          roomQuantity={roomQuantity}
                          ticketQuantity={ticketQuantity}
                          loungePassQuantity={loungePassQuantity}
                          dateRange={dateRange}
                          selectedCurrency={selectedCurrency}
                        />
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

export { PricingSheet };
