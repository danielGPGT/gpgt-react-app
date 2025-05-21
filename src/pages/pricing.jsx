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
import { BadgePoundSterling, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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
  const [transferDirection, setTransferDirection] = useState("both");
  const [createFlightBooking, setCreateFlightBooking] = useState(false);
  const [flightPNR, setFlightPNR] = useState("");
  const [ticketingDeadline, setTicketingDeadline] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [createLoungeBooking, setCreateLoungeBooking] = useState(false);
  const [loungeBookingRef, setLoungeBookingRef] = useState("");
  const [flightQuantity, setFlightQuantity] = useState(0);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [b2bCommission, setB2BCommission] = useState(0);
  const [availableCurrencies, setAvailableCurrencies] = useState(["GBP", "USD", "EUR", "AUD", "CAD"]);
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loungePasses, setLoungePasses] = useState([]);
  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [airportTransfers, setAirportTransfers] = useState([]);
  const [packageTiers, setPackageTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingLoungePasses, setLoadingLoungePasses] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingTiers, setLoadingTiers] = useState(false);

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

  const handleEventSelect = async (eventId) => {
    if (eventId === "none") {
      // Reset all states when event is deselected
      setSelectedEvent(null);
      setSelectedPackage(null);
      setSelectedHotel(null);
      setSelectedRoom(null);
      setSelectedTicket(null);
      setSelectedCircuitTransfer(null);
      setSelectedAirportTransfer(null);
      setSelectedFlight(null);
      setSelectedLoungePass(null);
      setDateRange({ from: null, to: null });
      setOriginalNights(0);
      setTicketQuantity(0);
      setCircuitTransferQuantity(0);
      setAirportTransferQuantity(0);
      setLoungePassQuantity(0);
      return;
    }

    const foundEvent = events.find((ev) => ev.event_id === eventId);
    setSelectedEvent(foundEvent);

    // Reset dependent states
    setSelectedPackage(null);
    setSelectedHotel(null);
    setSelectedRoom(null);
    setSelectedTicket(null);
    setSelectedCircuitTransfer(null);
    setSelectedAirportTransfer(null);
    setSelectedFlight(null);
    setSelectedLoungePass(null);
    setDateRange({ from: null, to: null });
    setOriginalNights(0);
    setTicketQuantity(0);
    setCircuitTransferQuantity(0);
    setAirportTransferQuantity(0);
    setLoungePassQuantity(0);

    if (foundEvent) {
      try {
        setLoadingPackages(true);
        const res = await api.get("/packages", {
          params: { eventId: foundEvent.event_id },
        });
        setPackages(res.data);

        // Fetch flights and lounge passes for this event
        setLoadingFlights(true);
        setLoadingLoungePasses(true);
        const [flightsRes, loungeRes] = await Promise.all([
          api.get("/flights", { params: { eventId: foundEvent.event_id } }),
          api.get("/lounge-passes", {
            params: { eventId: foundEvent.event_id },
          }),
        ]);
        setFlights(flightsRes.data);
        setLoungePasses(loungeRes.data);
      } catch (error) {
        console.error("Failed to fetch event data:", error.message);
        toast.error("Failed to load event data. Please try again.");
      } finally {
        setLoadingPackages(false);
        setLoadingFlights(false);
        setLoadingLoungePasses(false);
      }
    }
  };

  const handlePackageSelect = async (packageId) => {
    if (packageId === "none") {
      setSelectedPackage(null);
      setSelectedHotel(null);
      setSelectedRoom(null);
      setSelectedTicket(null);
      setSelectedCircuitTransfer(null);
      setSelectedAirportTransfer(null);
      setDateRange({ from: null, to: null });
      setOriginalNights(0);
      setTicketQuantity(0);
      setCircuitTransferQuantity(0);
      setAirportTransferQuantity(0);
      setPackageTiers([]);
      setSelectedTier(null);
      return;
    }

    const foundPackage = packages.find((pkg) => pkg.package_id === packageId);
    setSelectedPackage(foundPackage);

    // Reset dependent states
    setSelectedHotel(null);
    setSelectedRoom(null);
    setSelectedTicket(null);
    setSelectedCircuitTransfer(null);
    setSelectedAirportTransfer(null);
    setDateRange({ from: null, to: null });
    setOriginalNights(0);
    setTicketQuantity(0);
    setCircuitTransferQuantity(0);
    setAirportTransferQuantity(0);
    setSelectedTier(null);

    if (foundPackage) {
      try {
        setLoadingTiers(true);
        setLoadingHotels(true);
        setLoadingTickets(true);
        
        // Fetch package tiers
        const tiersRes = await api.get("/package-tiers", {
          params: { packageId: foundPackage.package_id },
        });
        setPackageTiers(tiersRes.data);

        // Fetch hotels and tickets
        const [hotelsRes, ticketsRes] = await Promise.all([
          api.get("/hotels", {
            params: { packageId: foundPackage.package_id },
          }),
          api.get("/tickets", {
            params: { packageId: foundPackage.package_id },
          }),
        ]);
        setHotels(hotelsRes.data);
        setTickets(ticketsRes.data);
      } catch (error) {
        console.error("Failed to fetch package data:", error.message);
        toast.error("Failed to load package data. Please try again.");
      } finally {
        setLoadingTiers(false);
        setLoadingHotels(false);
        setLoadingTickets(false);
      }
    }
  };

  const handleBookingSubmit = async (formData) => {
    try {
      // Calculate payment amounts (assuming 3 equal payments)
      const paymentAmount = totalPrice / 3;

      // Format dates for the API
      const formatDate = (date) => {
        if (!date) return '';
        return format(new Date(date), "dd-LLL-y");
      };

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
        airport_transfer_direction: selectedAirportTransfer ? transferDirection : '',
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
        payment_1: paymentAmount,
        payment_1_date: formatDate(formData.payment1_date),
        payment_2: paymentAmount,
        payment_2_date: formatDate(formData.payment2_date),
        payment_3: paymentAmount,
        payment_3_date: formatDate(formData.payment3_date),
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
                  transferDirection={transferDirection}
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
                        transferDirection={transferDirection}
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
                          {!selectedRoom && !selectedTicket ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                              <Package className="h-12 w-12 text-primary" />
                              <div className="space-y-2">
                                <h3 className="font-semibold text-lg">No Items Selected</h3>
                                <p className="text-sm text-muted-foreground">
                                  Select a room or ticket to see pricing details and create a booking
                                </p>
                              </div>
                            </div>
                          ) : (
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
                                <span className="text-muted-foreground">Circuit Transfer:</span>
                                <span className="font-medium">
                                  {selectedCircuitTransfer ? `${selectedCircuitTransfer.transport_type} x ${circuitTransferQuantity}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Airport Transfer:</span>
                                <span className="font-medium">
                                  {selectedAirportTransfer ? `${selectedAirportTransfer.transport_type} x ${airportTransferQuantity}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Flight:</span>
                                <span className="font-medium">
                                  {selectedFlight ? `${selectedFlight.airline} - ${selectedFlight.class}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Lounge Pass:</span>
                                <span className="font-medium">
                                  {selectedLoungePass ? `${selectedLoungePass.variant} x ${loungePassQuantity}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between border-b pb-3 mt-6">
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Price</p>
                                  <h2 className="text-xl font-bold text-foreground">
                                    {currencySymbols[selectedCurrency]}
                                    {Number(totalPrice).toFixed(0)}
                                  </h2>
                                </div>
                                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                  <SelectTrigger className="w-20 h-8 text-xs bg-background">
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableCurrencies.map((curr) => (
                                      <SelectItem key={curr} value={curr}>
                                        {curr}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-between mb-6">
                                <span className="text-muted-foreground">Commission:</span>
                                <span className="font-medium text-muted-foreground">
                                  ({b2bCommission * 100}% payable on total price)
                                </span>
                              </div>
                              <Button 
                                className="w-full" 
                                onClick={() => setShowRequestDialog(true)}
                              >
                                Request Booking
                              </Button>
                              {salesTeams.length > 0 && (
                                <div className="mt-4 pt-4 border-t space-y-2">
                                  <h3 className="text-sm text-foreground">
                                    For more info contact our sales team:
                                  </h3>
                                  <p className="text-sm font-semibold text-foreground">
                                    Name: {salesTeams[0].first_name} {salesTeams[0].last_name}
                                  </p>
                                  <p className="text-sm font-semibold text-foreground">
                                    Email:{" "}
                                    <a
                                      href={`mailto:${salesTeams[0].email}`}
                                      className="text-primary underline"
                                    >
                                      {salesTeams[0].email}
                                    </a>
                                  </p>
                                  <p className="text-sm font-semibold text-foreground">
                                    Phone:{" "}
                                    <a
                                      href={`tel:${salesTeams[0].phone}`}
                                      className="text-primary underline"
                                    >
                                      {salesTeams[0].phone}
                                    </a>
                                  </p>
                                  {selectedPackage?.url && (
                                    <a
                                      href={selectedPackage.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary underline font-bold inline-block"
                                    >
                                      View More Package Details Here
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
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
                                <span className="text-muted-foreground">Circuit Transfer:</span>
                                <span className="font-medium">
                                  {selectedCircuitTransfer ? `${selectedCircuitTransfer.transport_type} x ${circuitTransferQuantity}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Airport Transfer:</span>
                                <span className="font-medium">
                                  {selectedAirportTransfer ? `${selectedAirportTransfer.transport_type} x ${airportTransferQuantity}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Flight:</span>
                                <span className="font-medium">
                                  {selectedFlight ? `${selectedFlight.airline} - ${selectedFlight.class}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Lounge Pass:</span>
                                <span className="font-medium">
                                  {selectedLoungePass ? `${selectedLoungePass.variant} x ${loungePassQuantity}` : "Not selected"}
                                </span>
                              </div>
                              <div className="flex justify-between mt-6">
                                <span className="text-muted-foreground">Total Price:</span>
                                <div className="flex items-center gap-2">
                                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                    <SelectTrigger className="h-6 text-xs bg-background">
                                      <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableCurrencies.map((curr) => (
                                        <SelectItem key={curr} value={curr}>
                                          {curr}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="font-medium">
                                    {currencySymbols[selectedCurrency]}{Math.round(totalPrice).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Commission:</span>
                                <span className="font-medium text-muted-foreground">
                                  ({b2bCommission * 100}% payable on total price)
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
                    {!selectedRoom && !selectedTicket ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <Package className="h-12 w-12 text-primary" />
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">No Items Selected</h3>
                          <p className="text-sm text-muted-foreground">
                            Select a room or ticket to see pricing details and create a booking
                          </p>
                        </div>
                      </div>
                    ) : (
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
                          <span className="text-muted-foreground">Circuit Transfer:</span>
                          <span className="font-medium">
                            {selectedCircuitTransfer ? `${selectedCircuitTransfer.transport_type} x ${circuitTransferQuantity}` : "Not selected"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Airport Transfer:</span>
                          <span className="font-medium">
                            {selectedAirportTransfer ? `${selectedAirportTransfer.transport_type} x ${airportTransferQuantity}` : "Not selected"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Flight:</span>
                          <span className="font-medium">
                            {selectedFlight ? `${selectedFlight.airline} - ${selectedFlight.class}` : "Not selected"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lounge Pass:</span>
                          <span className="font-medium">
                            {selectedLoungePass ? `${selectedLoungePass.variant} x ${loungePassQuantity}` : "Not selected"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Price</p>
                            <h2 className="text-xl font-bold text-foreground">
                              {currencySymbols[selectedCurrency]}
                              {Number(totalPrice).toFixed(0)}
                            </h2>
                          </div>
                          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                            <SelectTrigger className="w-20 h-8 text-xs bg-background">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCurrencies.map((curr) => (
                                <SelectItem key={curr} value={curr}>
                                  {curr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commission:</span>
                          <span className="font-medium text-muted-foreground">
                            ({b2bCommission * 100}% payable on total price)
                          </span>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => setShowRequestDialog(true)}
                        >
                          Request Booking
                        </Button>
                        {salesTeams.length > 0 && (
                          <div className="mt-4 pt-4 border-t space-y-2">
                            <h3 className="text-sm text-foreground">
                              For more info contact our sales team:
                            </h3>
                            <p className="text-sm font-semibold text-foreground">
                              Name: {salesTeams[0].first_name} {salesTeams[0].last_name}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              Email:{" "}
                              <a
                                href={`mailto:${salesTeams[0].email}`}
                                className="text-primary underline"
                              >
                                {salesTeams[0].email}
                              </a>
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              Phone:{" "}
                              <a
                                href={`tel:${salesTeams[0].phone}`}
                                className="text-primary underline"
                              >
                                {salesTeams[0].phone}
                              </a>
                            </p>
                            {selectedPackage?.url && (
                              <a
                                href={selectedPackage.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline font-bold inline-block"
                              >
                                View More Package Details Here
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
                              {selectedRoom ? `${selectedRoom.room_category} - ${selectedRoom.room_type} x ${roomQuantity}` : "Not selected"}
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
                            <span className="text-muted-foreground">Circuit Transfer:</span>
                            <span className="font-medium">
                              {selectedCircuitTransfer ? `${selectedCircuitTransfer.transport_type} x ${circuitTransferQuantity}` : "Not selected"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Airport Transfer:</span>
                            <span className="font-medium">
                              {selectedAirportTransfer ? `${selectedAirportTransfer.transport_type} x ${airportTransferQuantity}` : "Not selected"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Price:</span>
                            <div className="flex items-center gap-2">
                              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                <SelectTrigger className="h-6 text-xs bg-background">
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCurrencies.map((curr) => (
                                    <SelectItem key={curr} value={curr}>
                                      {curr}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="font-medium">
                                {currencySymbols[selectedCurrency]}{Math.round(totalPrice).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commission:</span>
                            <span className="font-medium text-muted-foreground">
                              ({b2bCommission * 100}% payable on total price)
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
