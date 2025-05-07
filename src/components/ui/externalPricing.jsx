import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Star,
  Plane,
  Ticket,
  Hotel,
  Bed,
  Coffee,
  Bus,
  CalendarDays,
  Package,
  Trophy,
  Layers,
} from "lucide-react";
import { parse } from "date-fns";
import { differenceInCalendarDays } from "date-fns";
import { MonitorPlay, Umbrella, Hash, CheckCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { toast } from "react-hot-toast";
import { Combobox } from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { jwtDecode } from "jwt-decode";

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
  setSelectedCurrency,
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

  const [packageTiers, setPackageTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  const [b2bCommission, setB2bCommission] = useState(0.1); // default 10%

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
    console.log("b2bCommission:", b2bCommission);
    const finalTotal = rounded * (1 + b2bCommission);
    //const finalRounded = Math.ceil(finalTotal / 100) * 100 - 2;
    setTotalPrice(finalTotal * exchangeRate);
    //setTotalPrice(finalRounded * exchangeRate);
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
    b2bCommission,
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

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const decoded = jwtDecode(token);

        if (decoded && decoded.b2b_commission !== undefined) {
          // Now handling b2b_commission as an integer
          const commission = Number(decoded.b2b_commission) / 100;
          setB2bCommission(commission);
        } else {
          console.log("No b2b_commission found in token");
        }
      } catch (error) {
        console.error("Failed to decode user token:", error);
      }
    }
    fetchUser();
  }, []);

  // Add a useEffect to monitor b2bCommission changes
  useEffect(() => {
    console.log("b2bCommission state changed:", b2bCommission);
  }, [b2bCommission]);

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
      console.log("Sales teams updated:", salesTeams);
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
        console.log("Fetched sales teams:", salesTeamsRes.data);
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
    setPackageTiers([]);
    setSelectedTier(null);

    if (foundPackage) {
      try {
        setLoadingHotels(true);
        setLoadingTickets(true);
        setLoadingTiers(true);

        const [hotelsRes, ticketsRes, tiersRes] = await Promise.all([
          api.get("/hotels", {
            params: { packageId: foundPackage.package_id },
          }),
          api.get("/tickets", {
            params: { packageId: foundPackage.package_id },
          }),
          api.get("/package-tiers", {
            params: { packageId: foundPackage.package_id },
          }),
        ]);

        setHotels(hotelsRes.data);
        setTickets(ticketsRes.data);
        setPackageTiers(tiersRes.data);
      } catch (error) {
        console.error(
          "Failed to fetch hotels, tickets, or tiers:",
          error.message
        );
        setHotels([]);
        setTickets([]);
        setPackageTiers([]);
      } finally {
        setLoadingHotels(false);
        setLoadingTickets(false);
        setLoadingTiers(false);
      }
    }
  };

  const handleTierSelect = async (tierId) => {
    if (tierId === "none") {
      setSelectedTier(null);
      return;
    }
    const selectedTierData = packageTiers.find(
      (tier) => tier.tier_id === tierId
    );
    setSelectedTier(selectedTierData);

    if (selectedTierData) {
      try {
        // Set ticket
        if (selectedTierData.ticket_id) {
          const ticket = tickets.find(
            (t) => t.ticket_id === selectedTierData.ticket_id
          );
          if (ticket) {
            if (parseInt(ticket.remaining) <= 0) {
              // Find next available ticket
              const nextAvailableTicket = tickets.find(
                (t) => parseInt(t.remaining) > 0
              );
              if (nextAvailableTicket) {
                setSelectedTicket(nextAvailableTicket);
                setTicketQuantity(numberOfAdults);
                toast.success(
                  `Selected ticket was sold out. Automatically selected next available ticket: ${nextAvailableTicket.ticket_name}`
                );
              } else {
                toast.error("No available tickets found");
              }
            } else {
              setSelectedTicket(ticket);
              setTicketQuantity(numberOfAdults);
            }
          }
        }

        // Set hotel and fetch rooms/transfers
        if (selectedTierData.hotel_id) {
          const hotel = hotels.find(
            (h) => h.hotel_id === selectedTierData.hotel_id
          );
          if (hotel) {
            setSelectedHotel(hotel);

            // Fetch rooms and transfers for the hotel
            setLoadingRooms(true);
            setLoadingCircuitTransfers(true);
            setLoadingAirportTransfers(true);
            try {
              const [roomsRes, circuitRes, airportRes] = await Promise.all([
                api.get("/rooms", {
                  params: { hotelId: hotel.hotel_id },
                }),
                api.get("/circuit-transfers", {
                  params: { hotelId: hotel.hotel_id },
                }),
                api.get("/airport-transfers", {
                  params: { hotelId: hotel.hotel_id },
                }),
              ]);

              setRooms(roomsRes.data);
              setCircuitTransfers(circuitRes.data);
              setAirportTransfers(airportRes.data);

              // Set the room if specified in tier
              if (selectedTierData.room_id) {
                const room = roomsRes.data.find(
                  (r) => r.room_id === selectedTierData.room_id
                );
                if (room) {
                  if (parseInt(room.remaining) <= 0) {
                    // Find next available room
                    const nextAvailableRoom = roomsRes.data.find(
                      (r) => parseInt(r.remaining) > 0
                    );
                    if (nextAvailableRoom) {
                      setSelectedRoom(nextAvailableRoom);
                      if (
                        nextAvailableRoom.check_in_date &&
                        nextAvailableRoom.check_out_date
                      ) {
                        const from = parse(
                          nextAvailableRoom.check_in_date,
                          "dd/MM/yyyy",
                          new Date()
                        );
                        const to = parse(
                          nextAvailableRoom.check_out_date,
                          "dd/MM/yyyy",
                          new Date()
                        );
                        setDateRange({ from, to });
                        const nights = differenceInCalendarDays(to, from);
                        setOriginalNights(nights);
                      }
                      toast.success(
                        `Selected room was sold out. Automatically selected next available room: ${nextAvailableRoom.room_category} - ${nextAvailableRoom.room_type}`
                      );
                    } else {
                      toast.error("No available rooms found");
                    }
                  } else {
                    setSelectedRoom(room);
                    if (room.check_in_date && room.check_out_date) {
                      const from = parse(
                        room.check_in_date,
                        "dd/MM/yyyy",
                        new Date()
                      );
                      const to = parse(
                        room.check_out_date,
                        "dd/MM/yyyy",
                        new Date()
                      );
                      setDateRange({ from, to });
                      const nights = differenceInCalendarDays(to, from);
                      setOriginalNights(nights);
                    }
                  }
                }
              }

              // Set circuit transfer if specified in tier
              if (selectedTierData.circuit_transfer_id) {
                const circuitTransfer = circuitRes.data.find(
                  (t) =>
                    t.circuit_transfer_id ===
                    selectedTierData.circuit_transfer_id
                );
                if (circuitTransfer) {
                  setSelectedCircuitTransfer(circuitTransfer);
                  setCircuitTransferQuantity(ticketQuantity);
                }
              }

              // Set airport transfer if specified in tier
              if (selectedTierData.airport_transfer_id) {
                const airportTransfer = airportRes.data.find(
                  (t) =>
                    t.airport_transfer_id ===
                    selectedTierData.airport_transfer_id
                );
                if (airportTransfer) {
                  setSelectedAirportTransfer(airportTransfer);
                  const needed = Math.ceil(
                    numberOfAdults / (airportTransfer.max_capacity || 1)
                  );
                  setAirportTransferQuantity(needed);
                }
              }
            } catch (error) {
              console.error("Failed to fetch hotel data:", error);
              toast.error("Failed to load hotel data. Please try again.");
            } finally {
              setLoadingRooms(false);
              setLoadingCircuitTransfers(false);
              setLoadingAirportTransfers(false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to set tier selections:", error.message);
        toast.error("Failed to set tier selections. Please try again.");
      }
    }
  };

  const handleHotelSelect = async (hotelId) => {
    if (hotelId === "none") {
      setSelectedHotel(null);
      setSelectedRoom(null);
      setSelectedCircuitTransfer(null);
      setRooms([]);
      setCircuitTransfers([]);
      setAirportTransfers([]);
      return;
    }
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
    if (roomId === "none") {
      setSelectedRoom(null);
      return;
    }
    const foundRoom = rooms.find((room) => room.room_id === roomId);
    setSelectedRoom(foundRoom);
  };

  const handleTicketSelect = (ticketId) => {
    if (ticketId === "none") {
      setSelectedTicket(null);
      return;
    }
    const foundTicket = tickets.find((ticket) => ticket.ticket_id === ticketId);
    setSelectedTicket(foundTicket);
  };

  const handleCircuitTransferSelect = (transferId) => {
    if (transferId === "none") {
      setSelectedCircuitTransfer(null);
      setCircuitTransferQuantity(0);
      return;
    }
    const found = circuitTransfers.find(
      (t) => t.circuit_transfer_id === transferId
    );
    setSelectedCircuitTransfer(found);
    setCircuitTransferQuantity(ticketQuantity);
  };

  const handleAirportTransferSelect = (transferId) => {
    if (transferId === "none") {
      setSelectedAirportTransfer(null);
      setAirportTransferQuantity(0);
      return;
    }
    const found = airportTransfers.find(
      (t) => t.airport_transfer_id === transferId
    );
    setSelectedAirportTransfer(found);
    const needed = Math.ceil(numberOfAdults / (found.max_capacity || 1));
    setAirportTransferQuantity(needed);
  };

  if (loadingEvents) {
    return <div className="p-8">Loading events...</div>;
  }

  return (
    <div className="p-4 space-y-4 bg-card rounded-md border shadow-sm w-full max-w-6xl mx-auto">
      {/* Event & Package & Tier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xs font-semibold mb-1 text-foreground">
            Select Sport
          </h2>
          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-full h-9 text-sm bg-background relative group hover:border-primary transition-colors">
              <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                <Trophy className="h-4 w-4" />
              </div>
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
          <h2 className="text-xs font-semibold mb-1 text-foreground">
            Select Event
          </h2>
          <Select onValueChange={handleEventSelect}>
            <SelectTrigger className="w-full h-9 text-sm bg-background relative group hover:border-primary transition-colors">
              <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                <CalendarDays className="h-4 w-4" />
              </div>
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
            <h2 className="text-xs font-semibold mb-1 text-foreground">
              Select Package
            </h2>
            {loadingPackages ? (
              <div className="text-xs text-muted-foreground">
                Loading packages...
              </div>
            ) : (
              <>
                <Select
                  onValueChange={handlePackageSelect}
                  value={selectedPackage?.package_id}
                >
                  <SelectTrigger className="w-full bg-background relative group hover:border-primary transition-colors">
                    <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                      <Package className="h-4 w-4" />
                    </div>
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
              </>
            )}
          </div>
        )}
        {selectedPackage && (
          <div>
            <h2 className="text-xs font-semibold mb-1 text-foreground">
              Select Tier
            </h2>
            {loadingTiers ? (
              <div className="text-xs text-muted-foreground">
                Loading tiers...
              </div>
            ) : (
              <Select
                onValueChange={handleTierSelect}
                value={selectedTier?.tier_id || "none"}
              >
                <SelectTrigger className="w-full bg-background relative group hover:border-primary transition-colors">
                  <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                    <Layers className="h-4 w-4" />
                  </div>
                  <SelectValue placeholder="Choose a tier...">
                    {selectedTier ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {selectedTier.tier_type}
                        </span>
                      </div>
                    ) : (
                      "Choose a tier..."
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Tier</SelectItem>
                  {packageTiers.map((tier) => (
                    <SelectItem key={tier.tier_id} value={tier.tier_id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{tier.tier_type}</span>
                      </div>
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
              <h2 className="text-xs font-semibold mb-1 text-foreground">
                Select Hotel
              </h2>
              {loadingHotels ? (
                <div className="text-xs text-muted-foreground">
                  Loading hotels...
                </div>
              ) : (
                <Select
                  onValueChange={handleHotelSelect}
                  value={selectedHotel?.hotel_id || "none"}
                >
                  <SelectTrigger className="w-full h-9 text-sm bg-background relative group hover:border-primary transition-colors">
                    <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                      <Hotel className="h-4 w-4" />
                    </div>
                    <SelectValue placeholder="Choose hotel">
                      {selectedHotel
                        ? selectedHotel.hotel_name
                        : "Choose hotel"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.hotel_id} value={hotel.hotel_id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {hotel.hotel_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Array(hotel.stars).fill("★").join("")}
                          </span>
                        </div>
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
            <Select
              onValueChange={handleRoomSelect}
              value={selectedRoom?.room_id || "none"}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                  <Bed className="h-4 w-4" />
                </div>
                <SelectValue placeholder="Choose a room...">
                  {selectedRoom
                    ? `${selectedRoom.room_category} - ${selectedRoom.room_type}`
                    : "Choose a room..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Room</SelectItem>
                {rooms.map((room) => (
                  <SelectItem
                    key={room.room_id}
                    value={room.room_id}
                    className="text-xs"
                    disabled={parseInt(room.remaining) <= 0}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {room.room_category} - {room.room_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {parseInt(room.remaining) > 0
                          ? `${room.remaining} rooms left`
                          : "Sold Out"}
                      </span>
                    </div>
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
                      <DialogTitle className="mb-2 text-foreground">
                        {selectedRoom.room_category} - {selectedRoom.room_type}
                      </DialogTitle>
                      <DialogDescription>
                        Room details for{" "}
                        <strong className="text-foreground">
                          {selectedRoom.hotel_name}
                        </strong>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="text-sm text-muted-foreground mt-2 space-y-2">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <p className="font-semibold text-foreground">
                            Room Category:
                          </p>
                          <p>{selectedRoom.room_category}</p>
                          <p className="font-semibold text-foreground">
                            Room Type:
                          </p>
                          <p>{selectedRoom.room_type}</p>
                          <p className="font-semibold text-foreground">
                            Flexibility:
                          </p>
                          <p>{selectedRoom.room_flexibility}</p>
                          <p className="font-semibold text-foreground">
                            Max Guests:
                          </p>
                          <p>{selectedRoom.max_guests}</p>
                          <p className="font-semibold text-foreground">
                            Breakfast:
                          </p>
                          <p>{selectedRoom["breakfast_(2_people)"]}</p>
                          <p className="font-semibold text-foreground">
                            Rooms Available:
                          </p>
                          <p>{selectedRoom.remaining}</p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-4"></DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="pt-2">
                  <p className="font-semibold mb-1 text-foreground">
                    Check in - Check out:
                  </p>
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={handleDateChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                    <p className="font-semibold text-foreground">
                      Room Quantity
                    </p>
                    <p className="text-muted-foreground">
                      (Max {selectedRoom.max_guests} guests per room)
                    </p>
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
          <h2 className="text-xs font-semibold text-foreground">
            Select Ticket
          </h2>
          {loadingTickets ? (
            <div className="text-xs text-muted-foreground">
              Loading tickets...
            </div>
          ) : (
            <Select
              onValueChange={handleTicketSelect}
              value={selectedTicket?.ticket_id || "none"}
            >
              <SelectTrigger className="w-full h-9 text-sm bg-background relative group hover:border-primary transition-colors">
                <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                  <Ticket className="h-4 w-4" />
                </div>
                <SelectValue placeholder="Choose ticket">
                  {selectedTicket
                    ? selectedTicket.ticket_name
                    : "Choose ticket"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Ticket</SelectItem>
                {tickets.map((ticket) => (
                  <SelectItem
                    key={ticket.ticket_id}
                    value={ticket.ticket_id}
                    disabled={
                      parseInt(ticket.remaining) <= 0 &&
                      ticket.remaining !== "purchased_to_order"
                    }
                    className={`text-xs ${
                      parseInt(ticket.remaining) <= 0 &&
                      ticket.remaining !== "purchased_to_order"
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{ticket.ticket_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ticket.ticket_type} •{" "}
                        {ticket.remaining === "purchased_to_order"
                          ? "Purchased to Order"
                          : parseInt(ticket.remaining) > 0
                          ? `${ticket.remaining} tickets left`
                          : "Sold Out"}
                      </span>
                    </div>
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
                      <DialogTitle className="mb-2 text-foreground">
                        {selectedTicket.ticket_name}
                      </DialogTitle>
                      <DialogDescription>
                        Ticket details for{" "}
                        <strong className="text-foreground">
                          {selectedTicket.ticket_name}
                        </strong>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="text-sm text-muted-foreground mt-2 space-y-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          Ticket Type: {selectedTicket.ticket_type}
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground">
                          Event Days: {selectedTicket.event_days}
                        </p>
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

                    <DialogFooter className="pt-4"></DialogFooter>
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
            <h2 className="text-xs font-semibold text-foreground">
              Circuit Transfer
            </h2>
            {loadingCircuitTransfers ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : (
              <Select
                onValueChange={handleCircuitTransferSelect}
                value={selectedCircuitTransfer?.circuit_transfer_id || "none"}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                  <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                    <Bus className="h-4 w-4" />
                  </div>
                  <SelectValue placeholder="Select circuit transfer">
                    {selectedCircuitTransfer
                      ? selectedCircuitTransfer.transport_type
                      : "Select circuit transfer"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {circuitTransfers &&
                    circuitTransfers.map((transfer) => (
                      <SelectItem
                        key={transfer.circuit_transfer_id}
                        value={transfer.circuit_transfer_id}
                        className="text-xs"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {transfer.transport_type}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Airport Transfer */}
          <div className="p-3 border rounded-md space-y-2 bg-card">
            <h2 className="text-xs font-semibold text-foreground">
              Airport Transfer
            </h2>
            {loadingAirportTransfers ? (
              <div className="text-xs text-muted-foreground">Loading...</div>
            ) : (
              <Select
                onValueChange={handleAirportTransferSelect}
                value={selectedAirportTransfer?.airport_transfer_id || "none"}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                  <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                    <Bus className="h-4 w-4" />
                  </div>
                  <SelectValue placeholder="Select airport transfer">
                    {selectedAirportTransfer
                      ? selectedAirportTransfer.transport_type
                      : "Select airport transfer"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {airportTransfers &&
                    airportTransfers.map((transfer) => (
                      <SelectItem
                        key={transfer.airport_transfer_id}
                        value={transfer.airport_transfer_id}
                        className="text-xs"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {transfer.transport_type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (Max {transfer.max_capacity} people)
                          </span>
                        </div>
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
            <div className="text-xs text-muted-foreground">
              Loading flights...
            </div>
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
                    {flight.airline} • {flight.class} •{" "}
                    {currencySymbols[selectedCurrency]}
                    {flight.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedFlight && (
            <div className="text-xs space-y-1 pt-1">
              <p className="text-foreground">
                Outbound: {selectedFlight.outbound_flight}
              </p>
              <p className="text-foreground">
                Inbound: {selectedFlight.inbound_flight}
              </p>
              <p className="text-foreground">
                Price (pp): {currencySymbols[selectedCurrency]}
                {selectedFlight.price}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lounge Pass */}
      {selectedEvent && (
        <div className="p-3 border rounded-md space-y-2 bg-card">
          <h2 className="text-xs font-semibold text-foreground">Lounge Pass</h2>
          {loadingLoungePasses ? (
            <div className="text-xs text-muted-foreground">
              Loading lounge passes...
            </div>
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
            ({b2bCommission * 100}% Commission is payable on the total price.)
          </p>
        </div>
        {salesTeams.length > 0 ? (
          <div className="mt-4 p-4 space-y-2 rounded-md border shadow-sm bg-card">
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
            {/* Show package URL if present, below total price/commission */}
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
        ) : (
          <p className="text-sm text-muted-foreground italic"></p>
        )}
      </div>
    </div>
  );
}

export { ExternalPricing };
