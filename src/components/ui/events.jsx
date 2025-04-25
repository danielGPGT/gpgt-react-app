import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Star } from "lucide-react";
import { parse } from "date-fns";
import { differenceInCalendarDays } from "date-fns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";

function Events() {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [numberOfAdults, setNumberOfAdults] = useState(1);

  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [roomQuantity, setRoomQuantity] = useState(1);

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [loadingCircuitTransfers, setLoadingCircuitTransfers] = useState(false);
  const [selectedCircuitTransfer, setSelectedCircuitTransfer] = useState(null);
  const [circuitTransferQuantity, setCircuitTransferQuantity] = useState(1);

  const [airportTransfers, setAirportTransfers] = useState([]);
  const [loadingAirportTransfers, setLoadingAirportTransfers] = useState(false);
  const [selectedAirportTransfer, setSelectedAirportTransfer] = useState(null);
  const [airportTransferQuantity, setAirportTransferQuantity] = useState(1);

  const [flights, setFlights] = useState([]);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  const [loungePasses, setLoungePasses] = useState([]);
  const [loadingLoungePasses, setLoadingLoungePasses] = useState(false);
  const [selectedLoungePass, setSelectedLoungePass] = useState(null);
  const [loungePassQuantity, setLoungePassQuantity] = useState(1);

  const [originalNights, setOriginalNights] = useState(0);

  const minNights = selectedRoom?.nights || 1;

  const handleDateChange = (range) => {
    if (!range?.from || !range?.to) return;

    const nights = differenceInCalendarDays(range.to, range.from);

    const originalCheckIn = parse(
      selectedRoom.check_in_date,
      "dd/MM/yyyy",
      new Date()
    );
    const originalCheckOut = parse(
      selectedRoom.check_out_date,
      "dd/MM/yyyy",
      new Date()
    );

    const isOriginalRange =
      range.from.getTime() === originalCheckIn.getTime() &&
      range.to.getTime() === originalCheckOut.getTime();

    if (nights >= minNights || isOriginalRange) {
      setDateRange(range);
    } else {
      alert(`You must select at least ${minNights} nights.`);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/event");
        setEvents(res.data);
      } catch (error) {
        console.error("Failed to fetch events:", error.message);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  // Pre-fill date range when selectedRoom changes
  useEffect(() => {
    if (selectedRoom?.check_in_date && selectedRoom?.check_out_date) {
      const from = parse(selectedRoom.check_in_date, "dd/MM/yyyy", new Date());
      const to = parse(selectedRoom.check_out_date, "dd/MM/yyyy", new Date());

      setDateRange({ from, to });
      const nights = differenceInCalendarDays(to, from);
      setOriginalNights(nights);
    }
  }, [selectedRoom]);

  const handleEventSelect = async (eventId) => {
    const foundEvent = events.find((ev) => ev.event_id === eventId);
    setSelectedEvent(foundEvent);

    // Reset dependent states
    setSelectedPackage(null);
    setSelectedHotel(null);
    setSelectedRoom(null);
    setSelectedFlight(null); // <-- new
    setPackages([]);
    setHotels([]);
    setRooms([]);
    setFlights([]);
    setLoungePasses([]);

    if (foundEvent) {
      try {
        setLoadingPackages(true);
        setLoadingFlights(true); // <-- new
        setLoadingLoungePasses(true);

        const [packagesRes, flightsRes, loungePassesRes] = await Promise.all([
          api.get("/packages", { params: { eventId: foundEvent.event_id } }),
          api.get("/flights", { params: { eventId: foundEvent.event_id } }), // <-- new
          api.get("/lounge-passes", {
            params: { eventId: foundEvent.event_id },
          }), // <-- new
        ]);

        setPackages(packagesRes.data);
        setFlights(flightsRes.data); // <-- new
        setLoungePasses(loungePassesRes.data);
      } catch (error) {
        console.error("Failed to fetch packages or flights:", error.message);
        setPackages([]);
        setFlights([]); // <-- new
        setLoungePasses([]);
      } finally {
        setLoadingPackages(false);
        setLoadingFlights(false); // <-- new
        setLoadingLoungePasses(false);
      }
    }
  };

  const handlePackageSelect = async (packageId) => {
    const foundPackage = packages.find((pkg) => pkg.package_id === packageId);
    setSelectedPackage(foundPackage);
    setSelectedHotel(null);
    setSelectedRoom(null);
    setHotels([]);
    setRooms([]);
    setTickets([]);
    setSelectedTicket(null);

    if (foundPackage) {
      try {
        setLoadingHotels(true);
        setLoadingTickets(true);

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
        console.error("Failed to fetch hotels or tickets:", error.message);
        setHotels([]);
        setTickets([]);
      } finally {
        setLoadingHotels(false);
        setLoadingTickets(false);
      }
    }
  };

  const handleHotelSelect = async (hotelId) => {
    const foundHotel = hotels.find((hotel) => hotel.hotel_id === hotelId);
    setSelectedHotel(foundHotel);
    setSelectedRoom(null);
    setSelectedCircuitTransfer(null);
    setRooms([]);
    setCircuitTransfers([]);
    setAirportTransfers([]);

    if (foundHotel) {
      try {
        setLoadingRooms(true);
        setLoadingCircuitTransfers(true);
        setLoadingAirportTransfers(true);

        const [roomsRes, circuitTransfersRes, airportTransfersRes] =
          await Promise.all([
            api.get("/rooms", { params: { hotelId: foundHotel.hotel_id } }),
            api.get("/circuit-transfers", {
              params: { hotelId: foundHotel.hotel_id },
            }),
            api.get("/airport-transfers", {
              params: { hotelId: foundHotel.hotel_id },
            }),
          ]);

        setRooms(roomsRes.data);
        setCircuitTransfers(circuitTransfersRes.data);
        setAirportTransfers(airportTransfersRes.data);
      } catch (error) {
        console.error(
          "Failed to fetch rooms, circuit transfers, or airport transfers found:",
          error.message
        );
        setRooms([]);
        setCircuitTransfers([]);
        setAirportTransfers([]);
      } finally {
        setLoadingRooms(false);
        setLoadingCircuitTransfers(false);
        setLoadingAirportTransfers(false);
      }
    }
  };

  const handleRoomSelect = (roomId) => {
    const foundRoom = rooms.find((room) => room.room_id === roomId);
    setSelectedRoom(foundRoom);
  };

  if (loadingEvents) {
    return <div className="p-8">Loading events...</div>;
  }

  return (
    <div className="mt-8 p-6 space-y-4 border rounded-md shadow-sm border-rose-700">
      {/* Event Select */}
      <div>
        <h2 className="text-xl font-bold mb-2">Select Event</h2>

        <Select onValueChange={handleEventSelect}>
          <SelectTrigger className="w-full md:w-1/2">
            <SelectValue placeholder="Choose an event..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((event, idx) => (
              <SelectItem key={idx} value={event.event_id}>
                {event.event || event.event_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Package Select */}
      {selectedEvent && (
        <div>
          <h2 className="text-xl font-bold mb-2">Select Package</h2>

          {loadingPackages ? (
            <div>Loading packages...</div>
          ) : packages.length > 0 ? (
            <Select onValueChange={handlePackageSelect}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Choose a package..." />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg, idx) => (
                  <SelectItem key={idx} value={pkg.package_id}>
                    {pkg.package_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No packages available for this event.</p>
          )}

          {selectedEvent && (
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium">Number of Adults</p>
              <QuantitySelector
                value={numberOfAdults}
                onChange={setNumberOfAdults}
                min={1}
                max={100}
              />
            </div>
          )}
        </div>
      )}

      <div className="p-4 border rounded-md shadow-sm space-y-2 w-full">
        {/* Hotel Select */}
        {selectedPackage && (
          <div className="w-full ">
            <h2 className="text-xl font-bold mb-2">Select Hotel</h2>

            {loadingHotels ? (
              <div>Loading hotels...</div>
            ) : hotels.length > 0 ? (
              <Select onValueChange={handleHotelSelect}>
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue placeholder="Choose a hotel..." />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel, idx) => (
                    <SelectItem key={idx} value={hotel.hotel_id}>
                      {hotel.hotel_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p>No hotels available for this package.</p>
            )}

            {selectedHotel && (
              <div className="mt-6 space-y-2">
                <h2 className="text-xl font-bold">
                  {selectedHotel.hotel_name}{" "}
                  <span className="font-semibold">
                    {" "}
                    {[...Array(selectedHotel.stars)].map((_, index) => (
                      <Star
                        key={index}
                        className="inline-block w-4 h-4 text-black-500"
                      />
                    ))}
                  </span>
                </h2>
              </div>
            )}
          </div>
        )}

        {/* Room Select */}
        {selectedHotel && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Select Room</h2>

            {loadingRooms ? (
              <div>Loading rooms...</div>
            ) : rooms.length > 0 ? (
              <Select onValueChange={handleRoomSelect}>
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue placeholder="Choose a room..." />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room, idx) => (
                    <SelectItem key={idx} value={room.room_id}>
                      {room.room_category} - {room.room_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p>No rooms available for this hotel.</p>
            )}

            {selectedRoom && (
              <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
                <h2 className="text-xl font-semibold">
                  {selectedRoom.room_category} - {selectedRoom.room_type}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold whitespace-nowrap">
                    Check-in – Check-out:
                  </p>
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={handleDateChange}
                  />
                </div>
                <p>
                  <span className="font-semibold">Nights:</span>{" "}
                  {dateRange.from && dateRange.to
                    ? differenceInCalendarDays(dateRange.to, dateRange.from)
                    : "–"}
                </p>

                <p>
                  <span className="font-semibold">Remaining:</span>{" "}
                  {selectedRoom.remaining}
                </p>
                <p>
                  <span className="font-semibold">Max Guests (Per room):</span>{" "}
                  {selectedRoom.max_guests}
                </p>
                <div className="pt-2">
                  <p className="font-medium mb-1">Room Quantity</p>
                  <QuantitySelector
                    value={roomQuantity}
                    onChange={setRoomQuantity}
                    min={1}
                    max={parseInt(selectedRoom.remaining) || 10}
                  />
                </div>

                <p>
                  <span className="font-semibold">Total Price:</span>{" "}
                  {(() => {
                    if (!dateRange.from || !dateRange.to)
                      return selectedRoom.price;

                    const actualNights = differenceInCalendarDays(
                      dateRange.to,
                      dateRange.from
                    );
                    const extraNights = Math.max(
                      actualNights - originalNights,
                      0
                    );
                    const roomTotal =
                      (Number(selectedRoom.price) +
                        extraNights * Number(selectedRoom.extra_night_price)) *
                      Number(roomQuantity || 0);

                    return `£${roomTotal.toFixed(2)}`;
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-4 border rounded-md shadow-sm space-y-2 w-full">
        {selectedPackage && (
          <div className="w-full">
            <h2 className="text-xl font-bold mb-2">Select Ticket</h2>

            {loadingTickets ? (
              <div>Loading tickets...</div>
            ) : tickets.length > 0 ? (
              <Select
                onValueChange={(ticketId) => {
                  const foundTicket = tickets.find(
                    (t) => t.ticket_id === ticketId
                  );
                  setSelectedTicket(foundTicket);
                }}
              >
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue placeholder="Choose a ticket..." />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map((ticket, idx) => (
                    <SelectItem key={idx} value={ticket.ticket_id}>
                      {ticket.ticket_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p>No tickets available for this package.</p>
            )}

            {selectedTicket && (
              <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
                <h2 className="text-xl font-semibold">
                  {selectedTicket.ticket_name}
                </h2>
                <p>
                  <span className="font-semibold">Remaining:</span>{" "}
                  {selectedTicket.remaining}
                </p>
                <p>
                  <span className="font-semibold">Event Days:</span>{" "}
                  {selectedTicket.event_days}
                </p>

                <div className="pt-2">
                  <p className="font-medium mb-1">Select Quantity</p>
                  <QuantitySelector
                    value={ticketQuantity}
                    onChange={setTicketQuantity}
                    min={1}
                    max={parseInt(selectedTicket.remaining) || 10}
                  />
                </div>
                <p>
                  <span className="font-semibold">Total Price:</span>{" "}
                  {(() => {
                    const ticketTotal =
                      Number(selectedTicket.price) *
                      Number(ticketQuantity || 0);
                    return `£${ticketTotal.toFixed(2)}`;
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Circuit Transfers Select */}
      {selectedHotel && (
        <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
          <h2 className="text-xl font-bold mb-2">
            Circuit Transfers (Per Ticket)
          </h2>
          <div className="flex w-full justify-between gap-6">
            {loadingCircuitTransfers ? (
              <div>Loading circuit transfers...</div>
            ) : circuitTransfers.length > 0 ? (
              <Select
                onValueChange={(transferId) => {
                  const foundTransfer = circuitTransfers.find(
                    (t) => t.circuit_transfer_id === transferId
                  );
                  setSelectedCircuitTransfer(foundTransfer);
                }}
              >
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue placeholder="Choose a circuit transfer..." />
                </SelectTrigger>
                <SelectContent>
                  {circuitTransfers.map((transfer, idx) => (
                    <SelectItem key={idx} value={transfer.circuit_transfer_id}>
                      {transfer.transport_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p>No circuit transfers available for this hotel.</p>
            )}
          </div>
        </div>
      )}

      {/* Circuit Transfers Select */}
      {selectedHotel && (
        <div className="mt-6 p-4 border rounded-md shadow-sm space-y-2">
          <h2 className="text-xl font-bold mb-3">Select Airport Transfer</h2>
          <div className="flex w-full justify-between gap-6">
            {loadingAirportTransfers ? (
              <div>Loading airport transfers...</div>
            ) : airportTransfers.length > 0 ? (
              <Select
                onValueChange={(transferId) => {
                  const foundTransfer = airportTransfers.find(
                    (t) => t.airport_transfer_id === transferId
                  );
                  setSelectedAirportTransfer(foundTransfer);
                }}
              >
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue placeholder="Choose a airport transfer..." />
                </SelectTrigger>
                <SelectContent>
                  {airportTransfers.map((transfer, idx) => (
                    <SelectItem key={idx} value={transfer.airport_transfer_id}>
                      {transfer.transport_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p>No airport transfers available.</p>
            )}

            {selectedAirportTransfer && (
              <p>
                <span className="font-semibold">Transfers Required:</span>{" "}
                {Math.ceil(
                  numberOfAdults /
                    (Number(selectedAirportTransfer.max_capacity) || 1)
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div>
          <h2 className="text-xl font-bold mb-2">Select Flights</h2>

          {loadingFlights ? (
            <div>Loading flights...</div>
          ) : flights.length > 0 ? (
            <Select
              onValueChange={(flightId) => {
                const foundFlight = flights.find(
                  (f) => f.flight_id === flightId
                );
                setSelectedFlight(foundFlight);
              }}
            >
              <SelectTrigger className="w-full md:w-2/3">
                <SelectValue placeholder="Choose a return flight..." />
              </SelectTrigger>
              <SelectContent>
                {flights.map((flight, idx) => (
                  <SelectItem key={idx} value={flight.flight_id}>
                    {flight.airline} • {flight.class} • £{flight.price}
                    <br />✈ {flight.outbound_flight}
                    <br />↩ {flight.inbound_flight}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No flights available for this event.</p>
          )}

          {selectedFlight && (
            <div className="mt-6 p-4 border rounded-md shadow-sm text-sm space-y-1">
              <p>
                <strong>Airline:</strong> {selectedFlight.airline}
              </p>
              <p>
                <strong>Class:</strong> {selectedFlight.class}
              </p>
              <p>
                <strong>Outbound:</strong> {selectedFlight.outbound_flight}
              </p>
              <p>
                <strong>Inbound:</strong> {selectedFlight.inbound_flight}
              </p>
              <p>
                <strong>Price (pp):</strong> £{selectedFlight.price}{" "}
                {selectedFlight.currency}
              </p>
              <p>
                <strong>Source:</strong> {selectedFlight.source}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedEvent && (
        <div>
          <h2 className="text-xl font-bold mb-2">Select Lounge Pass</h2>

          {loadingLoungePasses ? (
            <div>Loading lounge passes...</div>
          ) : loungePasses.length > 0 ? (
            <Select
              onValueChange={(loungePassId) => {
                const foundLoungePass = loungePasses.find(
                  (lp) => lp.lounge_pass_id === loungePassId
                );
                setSelectedLoungePass(foundLoungePass);
                setLoungePassQuantity(1); // Reset quantity on selection
              }}
            >
              <SelectTrigger className="w-full md:w-2/3">
                <SelectValue placeholder="Choose a lounge pass..." />
              </SelectTrigger>
              <SelectContent>
                {loungePasses.map((lp, idx) => (
                  <SelectItem key={idx} value={lp.lounge_pass_id}>
                    {lp.variant} – £{lp.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p>No lounge passes available for this event.</p>
          )}

          {selectedLoungePass && (
            <div className="mt-6 p-4 border rounded-md shadow-sm text-sm space-y-3">
              <div className="space-y-1">
                <p>
                  <strong>Variant:</strong> {selectedLoungePass.variant}
                </p>
                <p>
                  <strong>Price:</strong> £{selectedLoungePass.price}
                </p>
              </div>

              <div>
                <p className="font-medium">Quantity</p>
                <QuantitySelector
                  value={loungePassQuantity}
                  onChange={setLoungePassQuantity}
                  min={1}
                  max={10} // or set a dynamic limit based on availability
                />
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xl font-bold">
        Total Price:{" "}
        {(() => {
          let total = 0;

          // Hotel room total
          if (selectedRoom && dateRange.from && dateRange.to) {
            const nights = differenceInCalendarDays(
              dateRange.to,
              dateRange.from
            );
            const extraNights = Math.max(nights - originalNights, 0);
            const roomTotal =
              (Number(selectedRoom.price) +
                extraNights * Number(selectedRoom.extra_night_price)) *
              Number(roomQuantity || 0);
            total += roomTotal;
          }

          // Ticket total
          if (selectedTicket) {
            total += Number(selectedTicket.price) * Number(ticketQuantity || 0);
          }

          // Circuit transfer total
          if (selectedCircuitTransfer) {
            total +=
              Number(selectedCircuitTransfer.price) *
              Number(ticketQuantity || 0);
          }

          // Airport transfer total
          if (selectedAirportTransfer) {
            const capacity = Number(selectedAirportTransfer.max_capacity) || 1;
            const transfersNeeded = Math.ceil(numberOfAdults / capacity);
            const airportTransferTotal =
              transfersNeeded * Number(selectedAirportTransfer.price);
            total += airportTransferTotal;
          }

          // Flight total
          if (selectedFlight) {
            total += Number(selectedFlight.price) * Number(numberOfAdults || 0);
          }

          // Lounge pass total
          if (selectedLoungePass) {
            total +=
              Number(selectedLoungePass.price) *
              Number(loungePassQuantity || 0);
          }

          // Apply rounding logic: Round UP to nearest 100, then subtract 2
          const roundedTotal = Math.ceil(total / 100) * 100 - 2;

          return `£${roundedTotal.toFixed(2)}`;
        })()}
      </p>
    </div>
  );
}

export { Events };
