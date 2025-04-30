"use client";

import { useEffect, useState } from "react";
import { DynamicBreadcrumb } from "@/components/ui/dy-breadcrumb";
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

  const handleBookingSubmit = async (formData) => {
    try {
      // Calculate payment amounts (assuming 3 equal payments)
      const paymentAmount = totalPrice / 3;

      // Format dates for the API
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = d.getDate().toString().padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
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
        room_price: selectedRoom ? selectedRoom.price * roomQuantity : 0,
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
        flight_price: selectedFlight ? selectedFlight.price * numberOfAdults : 0,
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
        atol_abtot: formData.atol_abtot
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
          <div className="flex gap-6 items-center">
            <SidebarTrigger />
            <DynamicBreadcrumb />
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
                />
                <BookingForm
                  numberOfAdults={numberOfAdults}
                  totalPrice={totalPrice}
                  selectedCurrency={selectedCurrency}
                  onSubmit={handleBookingSubmit}
                />
              </div>
            )}

            {/* Conditionally render based on role */}
            {role === "Admin" && (
              <div className="w-full">
                <Tabs defaultValue="internal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
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
                      />
                      <BookingForm
                        numberOfAdults={numberOfAdults}
                        totalPrice={totalPrice}
                        selectedCurrency={selectedCurrency}
                        onSubmit={handleBookingSubmit}
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
                    </div>
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
              </div>
            )}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

export { PricingSheet };
