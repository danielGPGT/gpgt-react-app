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

function Events({ numberOfAdults, setNumberOfAdults }) {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

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

  const availableCurrencies = ["GBP", "USD", "EUR", "AUD", "CAD"];
  const currencySymbols = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
  };

  const ASK_SPREAD = 0.5 * 0.1; // 0.5% ask added to every exchange rate

  // Inside your Events component
  const [selectedCurrency, setSelectedCurrency] = useState("GBP");
  const [exchangeRate, setExchangeRate] = useState(1);

  async function fetchExchangeRate(base = "GBP", target = "USD") {
    const res = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_9rR1LhiOwndKNXxJ62JGHbd294ispnSSTBBFHWFz&base_currency=${base}`
    );
    const data = await res.json();
    return data.data[target];
  }

  useEffect(() => {
    async function updateExchangeRate() {
      if (selectedCurrency === "GBP") {
        setExchangeRate(1);
        return;
      }
      const rate = await fetchExchangeRate("GBP", selectedCurrency);
      const adjustedRate = rate + ASK_SPREAD; // add 0.5
      setExchangeRate(adjustedRate);
    }

    updateExchangeRate();
  }, [selectedCurrency]);

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
    setSelectedFlight(null);
    setPackages([]);
    setHotels([]);
    setRooms([]);
    setFlights([]);
    setLoungePasses([]);

    if (foundEvent) {
      try {
        setLoadingPackages(true);
        setLoadingFlights(true);
        setLoadingLoungePasses(true);

        const [packagesRes, flightsRes, loungePassesRes] = await Promise.all([
          api.get("/packages", { params: { eventId: foundEvent.event_id } }),
          api.get("/flights", { params: { eventId: foundEvent.event_id } }),
          api.get("/lounge-passes", {
            params: { eventId: foundEvent.event_id },
          }),
        ]);

        setPackages(packagesRes.data);
        setFlights(flightsRes.data);
        setLoungePasses(loungePassesRes.data);

        // ⚡ AUTO SELECT FIRST PACKAGE based on the response directly
        if (packagesRes.data.length > 0) {
          const firstPackage = packagesRes.data[0];
          setSelectedPackage(firstPackage);

          // 🔥 Instead of calling handlePackageSelect immediately, replicate its logic here
          const foundPackage = firstPackage;
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
              console.error(
                "Failed to fetch hotels or tickets:",
                error.message
              );
              setHotels([]);
              setTickets([]);
            } finally {
              setLoadingHotels(false);
              setLoadingTickets(false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch packages or flights:", error.message);
        setPackages([]);
        setFlights([]);
        setLoungePasses([]);
      } finally {
        setLoadingPackages(false);
        setLoadingFlights(false);
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
    <div className="p-4 space-y-4 bg-neutral-50 rounded-md border shadow-sm w-full max-w-6xl mx-auto">
      {/* Event & Package */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold mb-1">Select Event</h2>
          <Select onValueChange={handleEventSelect}>
            <SelectTrigger className="w-full h-9 text-sm bg-white">
              <SelectValue placeholder="Choose event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.event_id} value={event.event_id}>
                  {event.event || event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedEvent && (
          <div>
            <h2 className="text-xs font-semibold mb-1">Select Package</h2>
            {loadingPackages ? (
              <div className="text-xs">Loading packages...</div>
            ) : (
              <Select
                onValueChange={handlePackageSelect}
                value={selectedPackage?.package_id} // 👈 THIS LINE: make the Select controlled
              >
                <SelectTrigger className="w-full bg-white">
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
            )}
          </div>
        )}
      </div>

      <div className="flex w-full justify-between items-end gap-4">
        {/* Hotel */}
        {selectedPackage && (
          <div className=" gap-4 w-full">
            <div>
              <h2 className="text-xs font-semibold mb-1">Select Hotel</h2>
              {loadingHotels ? (
                <div className="text-xs">Loading hotels...</div>
              ) : (
                <Select onValueChange={(id) => handleHotelSelect(id)}>
                  <SelectTrigger className="w-full h-9 text-sm bg-white">
                    <SelectValue placeholder="Choose hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.hotel_id} value={hotel.hotel_id}>
                        {hotel.hotel_name}{" "}
                        <span className="text-amber-500">
                          {Array(hotel.stars).fill("★").join("")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
        {/* Adults */}
        {selectedPackage && (
          <div className="flex items-center gap-4 w-full justify-end">
            <h2 className="text-xs font-semibold">Adults</h2>
            <QuantitySelector
              value={numberOfAdults}
              onChange={setNumberOfAdults}
              min={1}
              max={100}
            />
          </div>
        )}
      </div>

      {selectedHotel && (
        <div className="p-3 border rounded-md space-y-1 bg-white">
          <h2 className="text-xs font-semibold">Select Room</h2>

          {loadingRooms ? (
            <div className="text-xs text-muted-foreground">
              Loading rooms...
            </div>
          ) : (
            <Select onValueChange={handleRoomSelect}>
              <SelectTrigger className="w-full h-8 text-xs bg-white">
                <SelectValue placeholder="Choose a room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem
                    key={room.room_id}
                    value={room.room_id}
                    className="text-xs"
                  >
                    {room.room_category} - {room.room_type} - {room.remaining}{" "}
                    rooms left
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedRoom && (
            <div className="flex justify-between gap-4 pt-3 text-xs align-bottom items-end ">
              {/* Left Info */}
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Remaining rooms:</span>{" "}
                  {selectedRoom.remaining}
                </p>
                <p>
                  <span className="font-semibold">Max Guests (per room):</span>{" "}
                  {selectedRoom.max_guests}
                </p>
                <div className="pt-2">
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={handleDateChange}
                  />
                </div>
              </div>

              {/* Right Quantity + Pricing */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="font-semibold">Room Quantity</p>
                  <QuantitySelector
                    value={roomQuantity}
                    onChange={setRoomQuantity}
                    min={1}
                    max={parseInt(selectedRoom.remaining) || 10}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket */}
      {selectedPackage && (
        <div className="p-3 border rounded-md space-y-2 bg-white">
          <h2 className="text-xs font-semibold">Select Ticket</h2>
          {loadingTickets ? (
            <div className="text-xs">Loading tickets...</div>
          ) : (
            <Select
              onValueChange={(ticketId) => {
                const found = tickets.find((t) => t.ticket_id === ticketId);
                setSelectedTicket(found);
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm bg-white">
                <SelectValue placeholder="Choose ticket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tickets.map((ticket) => (
                  <SelectItem key={ticket.ticket_id} value={ticket.ticket_id}>
                    {ticket.ticket_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedTicket && (
            <div className="flex items-center justify-between gap-4 text-xs pt-2">
              <div>
                <p>Remaining: {selectedTicket.remaining}</p>
                <p>Event Days: {selectedTicket.event_days}</p>
              </div>
              <QuantitySelector
                value={ticketQuantity}
                onChange={setTicketQuantity}
                min={1}
                max={parseInt(selectedTicket.remaining) || 100}
              />
            </div>
          )}
        </div>
      )}

      {selectedHotel && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          {/* Circuit Transfer */}
          <div className="p-3 border rounded-md space-y-2 bg-white">
            <h2 className="text-xs font-semibold">Circuit Transfer</h2>
            {loadingCircuitTransfers ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : (
              <Select
                onValueChange={(id) => {
                  const found = circuitTransfers.find(
                    (t) => t.circuit_transfer_id === id
                  );
                  setSelectedCircuitTransfer(found);
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-white">
                  <SelectValue placeholder="Select circuit transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {circuitTransfers.map((transfer) => (
                    <SelectItem
                      key={transfer.circuit_transfer_id}
                      value={transfer.circuit_transfer_id}
                      className="text-xs"
                    >
                      {transfer.transport_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Airport Transfer */}
          <div className="p-3 border rounded-md space-y-2 bg-white">
            <h2 className="text-xs font-semibold">Airport Transfer</h2>
            {loadingAirportTransfers ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : (
              <Select
                onValueChange={(id) => {
                  const found = airportTransfers.find(
                    (t) => t.airport_transfer_id === id
                  );
                  setSelectedAirportTransfer(found);
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-white">
                  <SelectValue placeholder="Select airport transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {airportTransfers.map((transfer) => (
                    <SelectItem
                      key={transfer.airport_transfer_id}
                      value={transfer.airport_transfer_id}
                      className="text-xs"
                    >
                      {transfer.transport_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedAirportTransfer && (
              <p className="text-xs pt-1">
                Transfers Needed:{" "}
                {Math.ceil(
                  numberOfAdults / (selectedAirportTransfer.max_capacity || 1)
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flights */}
      {selectedEvent && (
        <div className="p-3 border rounded-md space-y-2 bg-white">
          <h2 className="text-xs font-semibold">Flight</h2>
          {loadingFlights ? (
            <div className="text-xs">Loading flights...</div>
          ) : (
            <Select
              onValueChange={(id) => {
                const found = flights.find((f) => f.flight_id === id);
                setSelectedFlight(found);
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm bg-white">
                <SelectValue placeholder="Select flight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {flights.map((flight) => (
                  <SelectItem key={flight.flight_id} value={flight.flight_id}>
                    {flight.airline} • {flight.class} • £{flight.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedFlight && (
            <div className="text-xs space-y-1 pt-1">
              <p>Outbound: {selectedFlight.outbound_flight}</p>
              <p>Inbound: {selectedFlight.inbound_flight}</p>
              <p>Price (pp): £{selectedFlight.price}</p>
            </div>
          )}
        </div>
      )}

      {/* Lounge Pass */}
      {selectedEvent && (
        <div className="p-3 border rounded-md space-y-2 bg-white">
          <h2 className="text-xs font-semibold">Lounge Pass</h2>
          {loadingLoungePasses ? (
            <div className="text-xs">Loading lounge passes...</div>
          ) : (
            <Select
              onValueChange={(id) => {
                const found = loungePasses.find(
                  (lp) => lp.lounge_pass_id === id
                );
                setSelectedLoungePass(found);
                setLoungePassQuantity(1);
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm bg-white">
                <SelectValue placeholder="Select lounge pass" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {loungePasses.map((lp) => (
                  <SelectItem key={lp.lounge_pass_id} value={lp.lounge_pass_id}>
                    {lp.variant} • £{lp.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedLoungePass && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span>Quantity:</span>
              <QuantitySelector
                value={loungePassQuantity}
                onChange={setLoungePassQuantity}
                min={1}
                max={10}
              />
            </div>
          )}
        </div>
      )}

      {/* Total Price */}
      <div className="pt-4 space-y-2">
        <div className="flex gap-2 items-center justify-center">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="border px-2 py-1 rounded-md text-xs"
          >
            {availableCurrencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>

          <h2 className="text-lg font-bold">
            Total:{" "}
            {(() => {
              let total = 0;
              if (selectedRoom && dateRange.from && dateRange.to) {
                const nights = differenceInCalendarDays(
                  dateRange.to,
                  dateRange.from
                );
                const extra = Math.max(nights - originalNights, 0);
                total +=
                  (Number(selectedRoom.price) +
                    extra * Number(selectedRoom.extra_night_price)) *
                  roomQuantity;
              }
              if (selectedTicket)
                total += Number(selectedTicket.price) * ticketQuantity;
              if (selectedCircuitTransfer)
                total += Number(selectedCircuitTransfer.price) * ticketQuantity;
              if (selectedAirportTransfer) {
                const needed = Math.ceil(
                  numberOfAdults / (selectedAirportTransfer.max_capacity || 1)
                );
                total += needed * Number(selectedAirportTransfer.price);
              }
              if (selectedFlight)
                total += Number(selectedFlight.price) * numberOfAdults;
              if (selectedLoungePass)
                total += Number(selectedLoungePass.price) * loungePassQuantity;

              if (total === 0) {
                return `${currencySymbols[selectedCurrency] || ""}0.00`;
              }

              const rounded = Math.ceil(total / 100) * 100 - 2;
              const finalAmount = (rounded * exchangeRate).toFixed(0);

              return `${currencySymbols[selectedCurrency] || ""}${finalAmount}`;
            })()}
          </h2>
        </div>
      </div>
    </div>
  );
}

export { Events };
