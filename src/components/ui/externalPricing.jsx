import { useEffect, useState } from "react";
import api from "@/lib/api";
import { MonitorPlay, Umbrella, Hash, CheckCircle } from "lucide-react";
import { parse } from "date-fns";
import { differenceInCalendarDays } from "date-fns";
import { useTheme } from "@/components/theme-provider";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge"


import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { QuantitySelector } from "@/components/ui/quantity-selector";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";

function ExternalPricing({
  numberOfAdults,
  setNumberOfAdults,
  totalPrice,
  setTotalPrice,
  setSalesTeam,
  selectedEvent,
  setSelectedEvent,
  selectedPackage,
  setSelectedPackage,
  selectedHotel,
  setSelectedHotel,
  selectedRoom,
  setSelectedRoom,
  selectedTicket,
  setSelectedTicket,
  selectedFlight,
  setSelectedFlight,
  selectedLoungePass,
  setSelectedLoungePass,
  selectedCircuitTransfer,
  setSelectedCircuitTransfer,
  selectedAirportTransfer,
  setSelectedAirportTransfer,
  circuitTransferQuantity,
  setCircuitTransferQuantity,
  airportTransferQuantity,
  setAirportTransferQuantity,
  roomQuantity,
  setRoomQuantity,
  ticketQuantity,
  setTicketQuantity,
  loungePassQuantity,
  setLoungePassQuantity,
  dateRange,
  setDateRange,
  selectedCurrency,
  setSelectedCurrency
}) {
  const { theme } = useTheme();
  const [selectedSport, setSelectedSport] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sports, setSports] = useState([]);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [loadingCircuitTransfers, setLoadingCircuitTransfers] = useState(false);

  const [airportTransfers, setAirportTransfers] = useState([]);
  const [loadingAirportTransfers, setLoadingAirportTransfers] = useState(false);

  const [flights, setFlights] = useState([]);
  const [loadingFlights, setLoadingFlights] = useState(false);

  const [loungePasses, setLoungePasses] = useState([]);
  const [loadingLoungePasses, setLoadingLoungePasses] = useState(false);

  const [salesTeams, setSalesTeams] = useState([]);
  const [loadingSalesTeams, setLoadingSalesTeams] = useState(false);

  const [originalNights, setOriginalNights] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);

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

  async function fetchExchangeRate(base = "GBP", target = "USD") {
    const res = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_9rR1LhiOwndKNXxJ62JGHbd294ispnSSTBBFHWFz&base_currency=${base}`
    );
    const data = await res.json();
    return data.data[target];
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/event");
        const allEvents = res.data;
        setEvents(allEvents);

        // Extract unique sports
        const uniqueSports = [...new Set(allEvents.map((ev) => ev.sport))];
        setSports(uniqueSports);
      } catch (error) {
        console.error("Failed to fetch events:", error.message);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedSport === "all") {
      setFilteredEvents(events); // Show all
    } else {
      const filtered = events.filter((ev) => ev.sport === selectedSport);
      setFilteredEvents(filtered);
    }
  }, [selectedSport, events]);

  useEffect(() => {
    let total = 0;

    if (selectedRoom && dateRange.from && dateRange.to) {
      const nights = differenceInCalendarDays(dateRange.to, dateRange.from);
      const extra = Math.max(nights - originalNights, 0);
      total +=
        (Number(selectedRoom.price) +
          extra * Number(selectedRoom.extra_night_price)) *
        roomQuantity;
    }

    if (selectedTicket) total += Number(selectedTicket.price) * ticketQuantity;
    if (selectedCircuitTransfer)
      total += Number(selectedCircuitTransfer.price) * ticketQuantity;
    if (selectedAirportTransfer) {
      const needed = Math.ceil(
        numberOfAdults / (selectedAirportTransfer.max_capacity || 1)
      );
      total += needed * Number(selectedAirportTransfer.price);
    }
    if (selectedFlight) total += Number(selectedFlight.price) * numberOfAdults;
    if (selectedLoungePass)
      total += Number(selectedLoungePass.price) * loungePassQuantity;

    if (total === 0) {
      setTotalPrice(0);
      return;
    }

    // 🔥 Round first, THEN apply 1.1 multiplier
    const rounded = Math.ceil(total / 100) * 100 - 2;
    const finalTotal = rounded * 1.1;
    const finalRounded = Math.ceil(finalTotal / 100) * 100 - 2;
    setTotalPrice(finalRounded * exchangeRate);
  }, [
    selectedRoom,
    selectedTicket,
    selectedCircuitTransfer,
    selectedAirportTransfer,
    selectedFlight,
    selectedLoungePass,
    dateRange,
    roomQuantity,
    ticketQuantity,
    numberOfAdults,
    loungePassQuantity,
    originalNights,
    exchangeRate,
  ]);

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

  useEffect(() => {
    if (salesTeams.length > 0) {
      console.log('Sales teams updated:', salesTeams);
      setSalesTeam(salesTeams);
    }
  }, [salesTeams, setSalesTeam]);

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
    setSalesTeams([]);

    if (foundEvent) {
      try {
        setLoadingPackages(true);
        setLoadingFlights(true);
        setLoadingLoungePasses(true);
        setLoadingSalesTeams(true);

        const [packagesRes, flightsRes, loungePassesRes, salesTeamsRes] =
          await Promise.all([
            api.get("/packages", { params: { eventId: foundEvent.event_id } }),
            api.get("/flights", { params: { eventId: foundEvent.event_id } }),
            api.get("/lounge-passes", {
              params: { eventId: foundEvent.event_id },
            }),
            api.get("/salesTeam", { params: { eventId: foundEvent.event_id } }),
          ]);

        setPackages(packagesRes.data);
        setFlights(flightsRes.data);
        setLoungePasses(loungePassesRes.data);
        console.log('Fetched sales teams:', salesTeamsRes.data);
        setSalesTeams(salesTeamsRes.data);
      } catch (error) {
        console.error("Failed to fetch packages or flights:", error.message);
        setPackages([]);
        setFlights([]);
        setLoungePasses([]);
        setSalesTeams([]);
      } finally {
        setLoadingPackages(false);
        setLoadingFlights(false);
        setLoadingLoungePasses(false);
        setLoadingSalesTeams(false);
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
    <div className="p-4 space-y-4 bg-card rounded-md border shadow-sm w-full max-w-6xl mx-auto">
      {/* Event & Package */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold mb-1 text-foreground">Select Sport</h2>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full h-9 text-sm bg-background">
              <SelectValue placeholder="All Sports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((sport, index) => (
                <SelectItem key={index} value={sport}>
                  {sport}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="text-xs font-semibold mb-1 text-foreground">Select Event</h2>
          <Select onValueChange={handleEventSelect}>
            <SelectTrigger className="w-full h-9 text-sm bg-background">
              <SelectValue placeholder="Choose event" />
            </SelectTrigger>
            <SelectContent>
              {filteredEvents.map((event) => (
                <SelectItem key={event.event_id} value={event.event_id}>
                  {event.event || event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedEvent && (
          <div>
            <h2 className="text-xs font-semibold mb-1 text-foreground">Select Package</h2>
            {loadingPackages ? (
              <div className="text-xs text-muted-foreground">Loading packages...</div>
            ) : (
              <Select
                onValueChange={handlePackageSelect}
                value={selectedPackage?.package_id}
              >
                <SelectTrigger className="w-full bg-background">
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
          <div className="gap-4 w-full">
            <div>
              <h2 className="text-xs font-semibold mb-1 text-foreground">Select Hotel</h2>
              {loadingHotels ? (
                <div className="text-xs text-muted-foreground">Loading hotels...</div>
              ) : (
                <Select onValueChange={(id) => handleHotelSelect(id)}>
                  <SelectTrigger className="w-full h-9 text-sm bg-background">
                    <SelectValue placeholder="Choose hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Hotel</SelectItem>
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
            <h2 className="text-xs font-semibold text-foreground">Adults</h2>
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
        <div className="p-3 border rounded-md space-y-1 bg-card">
          <h2 className="text-xs font-semibold text-foreground">Select Room</h2>

          {loadingRooms ? (
            <div className="text-xs text-muted-foreground">
              Loading rooms...
            </div>
          ) : (
            <Select onValueChange={handleRoomSelect}>
              <SelectTrigger className="w-full h-8 text-xs bg-background">
                <SelectValue placeholder="Choose a room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem
                    key={room.room_id}
                    value={room.room_id}
                    className="text-xs"
                    disabled={parseInt(room.remaining) <= 0}
                  >
                    {room.room_category} - {room.room_type}
                    {parseInt(room.remaining) > 0
                      ? ` (${room.remaining} rooms left)`
                      : " (Sold Out)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedRoom && (
            <div className="flex justify-between gap-4 pt-3 text-xs align-bottom items-end">
              <div className="space-y-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit text-xs bg-primary text-primary-foreground pointer-events-auto"
                    >
                      More Room info
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="mb-2 text-foreground">{selectedRoom.room_category} - {selectedRoom.room_type}</DialogTitle>
                      <DialogDescription>
                        Room details for{" "}
                        <strong className="text-foreground">{selectedRoom.hotel_name}</strong>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="text-sm text-muted-foreground mt-2 space-y-2">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <p className="font-semibold text-foreground">Room Category:</p>
                          <p>{selectedRoom.room_category}</p>
                          <p className="font-semibold text-foreground">Room Type:</p>
                          <p>{selectedRoom.room_type}</p>
                          <p className="font-semibold text-foreground">Flexibility:</p>
                          <p>{selectedRoom.room_flexibility}</p>
                          <p className="font-semibold text-foreground">Max Guests:</p>
                          <p>{selectedRoom.max_guests}</p>
                          <p className="font-semibold text-foreground">Breakfast:</p>
                          <p>{selectedRoom["breakfast_(2_people)"]}</p>
                          <p className="font-semibold text-foreground">Rooms Available:</p>
                          <p>{selectedRoom.remaining}</p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="pt-2">
                  <p className="font-semibold mb-1 text-foreground">Check in - Check out:</p>
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={handleDateChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                    <p className="font-semibold text-foreground">Room Quantity</p>
                    <p className="text-muted-foreground">(Max {selectedRoom.max_guests} guests per room)</p>
                  </div>
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
        <div className="p-3 border rounded-md space-y-2 bg-card">
          <h2 className="text-xs font-semibold text-foreground">Select Ticket</h2>
          {loadingTickets ? (
            <div className="text-xs text-muted-foreground">Loading tickets...</div>
          ) : (
            <Select
              onValueChange={(ticketId) => {
                const found = tickets.find((t) => t.ticket_id === ticketId);
                setSelectedTicket(found);
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm bg-background">
                <SelectValue placeholder="Choose ticket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Ticket</SelectItem>
                {tickets.map((ticket) => (
                  <SelectItem
                    key={ticket.ticket_id}
                    value={ticket.ticket_id}
                    disabled={parseInt(ticket.remaining) <= 0}
                    className={`text-xs ${
                      parseInt(ticket.remaining) <= 0 ? "text-muted-foreground" : ""
                    }`}
                  >
                    {ticket.ticket_name}{" "}
                    {parseInt(ticket.remaining) > 0
                      ? ` (${ticket.remaining} tickets left)`
                      : " (Sold Out)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedTicket && (
            <div className="flex items-center justify-between gap-4 text-xs pt-2 w-full">
              <div className="flex flex-col gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit text-xs bg-primary text-primary-foreground pointer-events-auto"
                    >
                      More Ticket info
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="mb-2 text-foreground">{selectedTicket.ticket_name}</DialogTitle>
                      <DialogDescription>
                        Ticket details for{" "}
                        <strong className="text-foreground">{selectedTicket.ticket_name}</strong>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="text-sm text-muted-foreground mt-2 space-y-2">
                      <div>
                        <p className="font-semibold text-foreground">Ticket Type: {selectedTicket.ticket_type}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground">Event Days: {selectedTicket.event_days}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {selectedTicket.video_wall && (
                          <Badge>
                            <div className="flex items-center gap-1 text-xs text-primary-foreground">
                              <MonitorPlay className="w-4 h-4 text-primary-foreground" />
                              <span>Video Wall</span>
                            </div>
                          </Badge>
                        )}
                        {selectedTicket.covered_seat && (
                          <Badge>
                            <div className="flex items-center gap-1 text-xs text-primary-foreground">
                              <Umbrella className="w-4 h-4 text-primary-foreground" />
                              <span>Covered Seat</span>
                            </div>
                          </Badge>
                        )}
                        {selectedTicket.numbered_seat && (
                          <Badge>
                            <div className="flex items-center gap-1 text-xs text-primary-foreground">
                              <Hash className="w-4 h-4 text-primary-foreground" />
                              <span>Numbered Seat</span>
                            </div>
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Circuit Transfer */}
          <div className="p-3 border rounded-md space-y-2 bg-card">
            <h2 className="text-xs font-semibold text-foreground">Circuit Transfer</h2>
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
                <SelectTrigger className="w-full h-8 text-xs bg-background">
                  <SelectValue placeholder="Select circuit transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Circuit Transfer</SelectItem>
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
          <div className="p-3 border rounded-md space-y-2 bg-card">
            <h2 className="text-xs font-semibold text-foreground">Airport Transfer</h2>
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
                <SelectTrigger className="w-full h-8 text-xs bg-background">
                  <SelectValue placeholder="Select airport transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Airport Transfer</SelectItem>
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
              <p className="text-xs pt-1 text-foreground">
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
        <div className="p-3 border rounded-md space-y-2 bg-card">
          <h2 className="text-xs font-semibold text-foreground">Flight</h2>
          {loadingFlights ? (
            <div className="text-xs text-muted-foreground">Loading flights...</div>
          ) : (
            <Select
              onValueChange={(id) => {
                const found = flights.find((f) => f.flight_id === id);
                setSelectedFlight(found);
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm bg-background">
                <SelectValue placeholder="Select flight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Flights</SelectItem>
                {flights.map((flight) => (
                  <SelectItem key={flight.flight_id} value={flight.flight_id}>
                    {flight.airline} • {flight.class} • {currencySymbols[selectedCurrency]}{flight.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedFlight && (
            <div className="text-xs space-y-1 pt-1">
              <p className="text-foreground">Outbound: {selectedFlight.outbound_flight}</p>
              <p className="text-foreground">Inbound: {selectedFlight.inbound_flight}</p>
              <p className="text-foreground">Price (pp): {currencySymbols[selectedCurrency]}{selectedFlight.price}</p>
            </div>
          )}
        </div>
      )}

      {/* Lounge Pass */}
      {selectedEvent && (
        <div className="p-3 border rounded-md space-y-2 bg-card">
          <h2 className="text-xs font-semibold text-foreground">Lounge Pass</h2>
          {loadingLoungePasses ? (
            <div className="text-xs text-muted-foreground">Loading lounge passes...</div>
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
              <SelectTrigger className="w-full h-9 text-sm bg-background">
                <SelectValue placeholder="Select lounge pass" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Lounge Pass</SelectItem>
                {loungePasses.map((lp) => (
                  <SelectItem key={lp.lounge_pass_id} value={lp.lounge_pass_id}>
                    {lp.variant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedLoungePass && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-foreground">Quantity:</span>
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
        <div className="flex gap-6 items-center">
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="text-xs bg-background">
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

          <h2 className="text-lg font-bold text-foreground">
            Total: {currencySymbols[selectedCurrency]}
            {Number(totalPrice).toFixed(0)}
          </h2>
          <p className="text-xs font-normal text-muted-foreground">
            (10% Commission is payable on the total price.)
          </p>
        </div>
        {salesTeams.length > 0 ? (
          <div className="mt-4 p-4 space-y-2 rounded-md border shadow-sm bg-card">
            <h3 className="text-sm text-foreground">For more info contact our sales team:</h3>
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
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic"></p>
        )}
      </div>
    </div>
  );
}

export { ExternalPricing };
