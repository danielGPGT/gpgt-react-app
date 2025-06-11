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
import { differenceInCalendarDays, differenceInDays } from "date-fns";
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
import { toast } from "sonner";
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
import { X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import PropTypes from "prop-types";

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
  flightQuantity,
  setFlightQuantity,
}) {
  const { theme } = useTheme();
  const [selectedSport, setSelectedSport] = useState("all");
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

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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

  const [exchangeRate, setExchangeRate] = useState(1);
  const [spread, setSpread] = useState(0);
  const [originalNights, setOriginalNights] = useState(0);
  const [b2bCommission, setB2bCommission] = useState(0);

  const [transferDirection, setTransferDirection] = useState("both");

  const [packageTiers, setPackageTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  const minNights = selectedRoom?.nights || 1;

  const availableCurrencies = ["GBP", "USD", "EUR", "AUD", "CAD"];
  const currencySymbols = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
  };

  const [showFlightDialog, setShowFlightDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("none");

  const [carouselIndex, setCarouselIndex] = useState(0);

  // Initialize quantities if not provided
  const [localRoomQuantity, setLocalRoomQuantity] = useState(roomQuantity || 1);
  const [localTicketQuantity, setLocalTicketQuantity] = useState(ticketQuantity || 0);
  const [localLoungePassQuantity, setLocalLoungePassQuantity] = useState(loungePassQuantity || 0);
  const [localCircuitTransferQuantity, setLocalCircuitTransferQuantity] = useState(circuitTransferQuantity || 0);
  const [localAirportTransferQuantity, setLocalAirportTransferQuantity] = useState(airportTransferQuantity || 0);
  const [localFlightQuantity, setLocalFlightQuantity] = useState(flightQuantity || 0);

  // Use props if available, otherwise use local state
  const effectiveRoomQuantity = roomQuantity ?? localRoomQuantity;
  const effectiveTicketQuantity = ticketQuantity ?? localTicketQuantity;
  const effectiveLoungePassQuantity = loungePassQuantity ?? localLoungePassQuantity;
  const effectiveCircuitTransferQuantity = circuitTransferQuantity ?? localCircuitTransferQuantity;
  const effectiveAirportTransferQuantity = airportTransferQuantity ?? localAirportTransferQuantity;
  const effectiveFlightQuantity = flightQuantity ?? localFlightQuantity;

  const setEffectiveRoomQuantity = setRoomQuantity ?? setLocalRoomQuantity;
  const setEffectiveTicketQuantity = setTicketQuantity ?? setLocalTicketQuantity;
  const setEffectiveLoungePassQuantity = setLoungePassQuantity ?? setLocalLoungePassQuantity;
  const setEffectiveCircuitTransferQuantity = setCircuitTransferQuantity ?? setLocalCircuitTransferQuantity;
  const setEffectiveAirportTransferQuantity = setAirportTransferQuantity ?? setLocalAirportTransferQuantity;
  const setEffectiveFlightQuantity = setFlightQuantity ?? setLocalFlightQuantity;

  async function fetchExchangeRate(base = "GBP", target = "USD") {
    const res = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_9rR1LhiOwndKNXxJ62JGHbd294ispnSSTBBFHWFz&base_currency=${base}`
    );
    const data = await res.json();
    return data.data[target];
  }

  // Fetch spread from /fx-spread
  useEffect(() => {
    const fetchSpread = async () => {
      try {
        const res = await api.get('/fx-spread');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSpread(Number(res.data[0].spread) || 0);
        }
      } catch (error) {
        console.error('Failed to fetch spread:', error);
      }
    };
    fetchSpread();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data);
        setFilteredEvents(res.data);
        
        // Extract unique sports from events
        const uniqueSports = [...new Set(res.data.map(event => event.sport))];
        setSports(uniqueSports.filter(sport => sport)); // Filter out any undefined/null values
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

  // Fetch B2B commission
  useEffect(() => {
    const fetchB2bCommission = async () => {
      try {
        const res = await api.get('/b2b-commission');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const commissionStr = res.data[0].b2b_commision;
          const commissionValue = parseFloat(commissionStr.replace('%', '')) / 100;
          setB2bCommission(commissionValue);
        }
      } catch (error) {
        console.error('Failed to fetch B2B commission:', error);
        setB2bCommission(0.1); // Default to 10% if fetch fails
      }
    };
    fetchB2bCommission();
  }, []);

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
      total += Number(selectedAirportTransfer.price) * needed;
    }
    if (selectedFlight) total += Number(selectedFlight.price) * flightQuantity;
    if (selectedLoungePass)
      total += Number(selectedLoungePass.price) * loungePassQuantity;

    if (total === 0) {
      setTotalPrice(0);
      return;
    }

    // First round to nearest 100 and subtract 2 (exactly like internal pricing)
    const rounded = Math.ceil(total / 100) * 100 - 2;

    // Then apply B2B commission
    const withCommission = rounded * (1 + b2bCommission);

    // Finally apply exchange rate
    setTotalPrice(withCommission * exchangeRate);
  }, [
    selectedRoom,
    dateRange,
    originalNights,
    roomQuantity,
    selectedTicket,
    ticketQuantity,
    selectedCircuitTransfer,
    selectedAirportTransfer,
    numberOfAdults,
    selectedFlight,
    flightQuantity,
    selectedLoungePass,
    loungePassQuantity,
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
      const adjustedRate = rate + spread;
      setExchangeRate(adjustedRate);
    }

    updateExchangeRate();
  }, [selectedCurrency, spread]);

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
    setDateRange(range);
    if (range?.from && range?.to) {
      const nights = differenceInDays(range.to, range.from);
      setOriginalNights(nights);
    } else {
      setOriginalNights(0);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
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
      setCategories([]);
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
    setCategories([]);

    if (foundEvent) {
      try {
        setLoadingPackages(true);
        setLoadingCategories(true);
        const [packagesRes] = await Promise.all([
          api.get("/packages", {
            params: { eventId: foundEvent.event_id },
          }),
        ]);
        setPackages(packagesRes.data);

        // Fetch flights and lounge passes for this event
        setLoadingFlights(true);
        setLoadingLoungePasses(true);
        const [flightsRes, loungeRes] = await Promise.all([
          api.get("/stock-flights", { params: { eventId: foundEvent.event_id } }),
          api.get("/stock-lounge-passes", {
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
      setSelectedFlight(null);
      setSelectedLoungePass(null);
      setSelectedCircuitTransfer(null);
      setSelectedAirportTransfer(null);
      setRooms([]);
      setHotels([]);
      setTickets([]);
      setFlights([]);
      setLoungePasses([]);
      setCircuitTransfers([]);
      setAirportTransfers([]);
      setPackageTiers([]);
      setSelectedTier(null);
      setDateRange({ from: null, to: null });
      setOriginalNights(0);
      return;
    }

    try {
      setLoadingHotels(true);
      setLoadingRooms(true);
      setLoadingTickets(true);
      setLoadingFlights(true);
      setLoadingLoungePasses(true);
      setLoadingCircuitTransfers(true);
      setLoadingAirportTransfers(true);
      setLoadingTiers(true);

      // First get rooms for this package
      const roomsRes = await api.get("/rooms", {
        params: { packageId },
      });
      console.log('Rooms API Response:', roomsRes.data);

      // Extract unique hotel IDs from rooms
      const uniqueHotelIds = [...new Set(roomsRes.data.map(room => room.hotel_id))];

      // Get hotels for these IDs
      const hotelsRes = await api.get("/hotels", {
        params: { hotelIds: uniqueHotelIds.join(',') },
      });
      console.log('Hotels API Response:', hotelsRes.data);

      // Get other data in parallel
      const [ticketsRes, flightsRes, loungePassesRes, circuitTransfersRes, airportTransfersRes, tiersRes] = await Promise.all([
        api.get("/tickets", { params: { packageId } }),
        api.get("/flights", { params: { packageId } }),
        api.get("/lounge-passes", { params: { packageId } }),
        api.get("/circuit-transfers", { params: { packageId } }),
        api.get("/airport-transfers", { params: { packageId } }),
        api.get("/package-tiers", { params: { packageId } })
      ]);

      console.log('Tickets API Response:', ticketsRes.data);
      console.log('Flights API Response:', flightsRes.data);
      console.log('Lounge Passes API Response:', loungePassesRes.data);
      console.log('Circuit Transfers API Response:', circuitTransfersRes.data);
      console.log('Airport Transfers API Response:', airportTransfersRes.data);
      console.log('Package Tiers API Response:', tiersRes.data);

      setRooms(roomsRes.data);
      setHotels(hotelsRes.data);
      setTickets(ticketsRes.data);
      setFlights(flightsRes.data);
      setLoungePasses(loungePassesRes.data);
      setCircuitTransfers(circuitTransfersRes.data);
      setAirportTransfers(airportTransfersRes.data);
      setPackageTiers(tiersRes.data);

      const foundPackage = packages.find((p) => p.package_id === packageId);
      setSelectedPackage(foundPackage);
    } catch (error) {
      console.error("Failed to fetch package data:", error);
      toast.error("Failed to load package data. Please try again.");
    } finally {
      setLoadingHotels(false);
      setLoadingRooms(false);
      setLoadingTickets(false);
      setLoadingFlights(false);
      setLoadingLoungePasses(false);
      setLoadingCircuitTransfers(false);
      setLoadingAirportTransfers(false);
      setLoadingTiers(false);
    }
  };

  const handleTierSelect = async (tierId) => {
    if (tierId === "none") {
      setSelectedTier(null);
      return;
    }
    const selectedTierData = packageTiers.find((tier) => tier.tier_id === tierId);
    setSelectedTier(selectedTierData);

    if (selectedTierData) {
      try {
        // Set ticket
        if (selectedTierData.ticket_id) {
          const ticket = tickets.find((t) => t.ticket_id === selectedTierData.ticket_id);
          if (ticket) {
            if (parseInt(ticket.remaining) <= 0) {
              // Find next available ticket
              const nextAvailableTicket = tickets.find((t) => parseInt(t.remaining) > 0);
              if (nextAvailableTicket) {
                // Fetch category info for next available ticket
                try {
                  const categoryRes = await api.get("/n-categories", {
                    params: { categoryId: nextAvailableTicket.category_id }
                  });
                  if (categoryRes.data && categoryRes.data.length > 0) {
                    const matchedCategory = categoryRes.data.find(cat => cat.category_id === nextAvailableTicket.category_id);
                    if (matchedCategory) {
                      const ticketWithCategory = {
                        ...nextAvailableTicket,
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
                      setSelectedTicket(ticketWithCategory);
                      setTicketQuantity(numberOfAdults);
                    } else {
                      setSelectedTicket(nextAvailableTicket);
                      setTicketQuantity(numberOfAdults);
                    }
                  } else {
                    setSelectedTicket(nextAvailableTicket);
                    setTicketQuantity(numberOfAdults);
                  }
                } catch (error) {
                  setSelectedTicket(nextAvailableTicket);
                  setTicketQuantity(numberOfAdults);
                }
              } else {
                toast.error("No available tickets found");
              }
            } else {
              // Fetch category info for selected ticket
              try {
                const categoryRes = await api.get("/n-categories", {
                  params: { categoryId: ticket.category_id }
                });
                if (categoryRes.data && categoryRes.data.length > 0) {
                  const matchedCategory = categoryRes.data.find(cat => cat.category_id === ticket.category_id);
                  if (matchedCategory) {
                    const ticketWithCategory = {
                      ...ticket,
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
                    setSelectedTicket(ticketWithCategory);
                    setTicketQuantity(numberOfAdults);
                  } else {
                    setSelectedTicket(ticket);
                    setTicketQuantity(numberOfAdults);
                  }
                } else {
                  setSelectedTicket(ticket);
                  setTicketQuantity(numberOfAdults);
                }
              } catch (error) {
                setSelectedTicket(ticket);
                setTicketQuantity(numberOfAdults);
              }
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
                api.get("/stock-rooms", {
                  params: { hotelId: hotel.hotel_id },
                }),
                api.get("/stock-circuit-transfers", {
                  params: { hotelId: hotel.hotel_id },
                }),
                api.get("/stock-airport-transfers", {
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
                  setCircuitTransferQuantity(effectiveTicketQuantity);
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
      setRooms([]);
      setDateRange({ from: null, to: null });
      setOriginalNights(0);
      return;
    }

    try {
      setLoadingRooms(true);
      setLoadingCircuitTransfers(true);
      setLoadingAirportTransfers(true);

      // Find hotel from our existing data
      const hotel = hotels.find(h => h.hotel_id === hotelId);
      setSelectedHotel(hotel);

      if (hotel) {
        // Get rooms for this hotel that match the selected package
        const roomsRes = await api.get("/rooms", {
          params: { 
            hotelId: hotel.hotel_id,
            packageId: selectedPackage?.package_id 
          },
        });
        console.log('Hotel Rooms API Response:', roomsRes.data);

        // Get transfers
        const [circuitRes, airportRes] = await Promise.all([
          api.get("/circuit-transfers", {
            params: { hotelId: hotel.hotel_id },
          }),
          api.get("/airport-transfers", {
            params: { hotelId: hotel.hotel_id },
          }),
        ]);
        console.log('Hotel Circuit Transfers API Response:', circuitRes.data);
        console.log('Hotel Airport Transfers API Response:', airportRes.data);

        setRooms(roomsRes.data);
        setCircuitTransfers(circuitRes.data);
        setAirportTransfers(airportRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch hotel data:", error);
      toast.error("Failed to load hotel data. Please try again.");
    } finally {
      setLoadingRooms(false);
      setLoadingCircuitTransfers(false);
      setLoadingAirportTransfers(false);
    }
  };

  const handleRoomSelect = async (roomId) => {
    if (roomId === "none") {
      setSelectedRoom(null);
      setDateRange({ from: null, to: null });
      setOriginalNights(0);
      return;
    }

    try {
      setLoadingRooms(true);
      const room = rooms.find((r) => r.room_id === roomId);
      console.log('Selected Room Full Data:', JSON.stringify(room, null, 2));
      if (room) {
        setSelectedRoom(room);
        // Set date range from room's check-in and check-out dates
        const from = new Date(room.check_in_date.split('/').reverse().join('-'));
        const to = new Date(room.check_out_date.split('/').reverse().join('-'));
        setDateRange({ from, to });
        setOriginalNights(room.nights);
      }
    } catch (error) {
      console.error("Failed to fetch room data:", error);
      toast.error("Failed to load room data. Please try again.");
    } finally {
      setLoadingRooms(false);
    }
  };

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
    console.log('Selected Ticket Data:', foundTicket);
    if (foundTicket) {
      try {
        // Fetch category using category_id
        const categoryRes = await api.get("/categories", {
          params: { 
            categoryId: foundTicket.category_id
          }
        });
        console.log('Ticket Category API Response:', categoryRes.data);
        
        if (categoryRes.data && categoryRes.data.length > 0) {
          const matchedCategory = categoryRes.data.find(cat => cat.category_id === foundTicket.category_id);
          if (matchedCategory) {
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
              setCircuitTransferQuantity(effectiveTicketQuantity);
            }
          } else {
            console.warn('No matching category found for ticket:', foundTicket);
            setSelectedTicket(foundTicket);
            setTicketQuantity(numberOfAdults);
            if (selectedCircuitTransfer) {
              setCircuitTransferQuantity(effectiveTicketQuantity);
            }
          }
        } else {
          console.warn('No category found for ticket:', foundTicket);
          setSelectedTicket(foundTicket);
          setTicketQuantity(numberOfAdults);
          if (selectedCircuitTransfer) {
            setCircuitTransferQuantity(effectiveTicketQuantity);
          }
        }
      } catch (error) {
        console.error('Failed to fetch category:', error);
        setSelectedTicket(foundTicket);
        setTicketQuantity(numberOfAdults);
        if (selectedCircuitTransfer) {
          setCircuitTransferQuantity(effectiveTicketQuantity);
        }
      }
    }
  };

  const handleCircuitTransferSelect = (transferId) => {
    if (transferId === "none") {
      setSelectedCircuitTransfer(null);
      setCircuitTransferQuantity(0);
      return;
    }

    const foundTransfer = circuitTransfers.find(
      (transfer) => transfer.circuit_transfer_id === transferId
    );
    console.log('Selected Circuit Transfer Full Data:', JSON.stringify(foundTransfer, null, 2));
    setSelectedCircuitTransfer(foundTransfer);
    setCircuitTransferQuantity(effectiveTicketQuantity);
  };

  const handleAirportTransferSelect = (transferId) => {
    if (transferId === "none") {
      setSelectedAirportTransfer(null);
      setAirportTransferQuantity(0);
      return;
    }

    const foundTransfer = airportTransfers.find(
      (transfer) => transfer.airport_transfer_id === transferId
    );
    console.log('Selected Airport Transfer Full Data:', JSON.stringify(foundTransfer, null, 2));
    setSelectedAirportTransfer(foundTransfer);
    const needed = Math.ceil(
      numberOfAdults / (foundTransfer.max_capacity || 1)
    );
    setAirportTransferQuantity(needed);
  };

  // Update circuit transfer quantity when ticket quantity changes
  useEffect(() => {
    if (selectedCircuitTransfer) {
      setCircuitTransferQuantity(effectiveTicketQuantity);
    }
  }, [effectiveTicketQuantity, selectedCircuitTransfer]);

  // Update flight quantity when number of adults changes
  useEffect(() => {
    if (selectedFlight) {
      setEffectiveFlightQuantity(numberOfAdults);
    }
  }, [numberOfAdults, selectedFlight]);

  // Update the flight display in the UI
  const renderFlightInfo = (flight) => {
    if (!flight) return null;
    
    const formatFlightTime = (flightTime) => {
      // Handle different date formats in the flight times
      const parts = flightTime.split(' ');
      const date = parts[0];
      const time = parts[1];
      const destination = parts[2];
      const arrivalDate = parts[3];
      const flightNumber = parts[4] ? `(${parts[4]})` : '';
      
      return `${date} ${time} ${destination} ${arrivalDate} ${flightNumber}`;
    };

    return (
      <div className="text-xs space-y-1 pt-1">
        <p className="text-foreground">Outbound: {formatFlightTime(flight.outbound_flight)}</p>
        <p className="text-foreground">Inbound: {formatFlightTime(flight.inbound_flight)}</p>
        <p className="text-foreground">
          Total Price: {currencySymbols[selectedCurrency]}
          {flight.unit_cost_local * effectiveFlightQuantity}
        </p>
      </div>
    );
  };

  // Update the flight dialog content
  const renderFlightDialog = () => (
    <AlertDialog open={showFlightDialog} onOpenChange={setShowFlightDialog}>
      <AlertDialogContent className="max-w-3xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={() => setShowFlightDialog(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        <AlertDialogHeader>
          <AlertDialogTitle>Select Flight</AlertDialogTitle>
          <AlertDialogDescription>
            Choose your departure location and select a flight
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Combobox
            options={[
              { value: "none", label: "No Flight" },
              { value: "all", label: "All Locations" },
              ...[...new Set(flights.map((f) => f.from_location))].map((location) => ({
                value: location,
                label: location,
              })),
            ]}
            value={selectedLocation}
            onChange={(value) => {
              setSelectedLocation(value);
              if (value === "none") {
                setSelectedFlight(null);
                setEffectiveFlightQuantity(0);
                setShowFlightDialog(false);
              }
            }}
            placeholder="Select departure location"
          />

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {selectedLocation === "none"
                ? null
                : flights
                    .filter(
                      (flight) =>
                        !selectedLocation ||
                        selectedLocation === "all" ||
                        flight.from_location === selectedLocation
                    )
                    .map((flight) => (
                      <div
                        key={flight.flight_id}
                        className={`p-3 border rounded-md cursor-pointer hover:bg-accent ${
                          selectedFlight?.flight_id === flight.flight_id ? "bg-accent" : ""
                        }`}
                        onClick={() => {
                          setSelectedFlight(flight);
                          setEffectiveFlightQuantity(numberOfAdults);
                          setShowFlightDialog(false);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {flight.airline} • {flight.class}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              From: {flight.from_location}
                            </p>
                            <div className="text-sm space-y-1">
                              <p>Outbound: {flight.outbound_flight}</p>
                              <p>Inbound: {flight.inbound_flight}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {currencySymbols[selectedCurrency]}
                              {flight.unit_cost_local * numberOfAdults}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {currencySymbols[selectedCurrency]}
                              {flight.unit_cost_local} per person
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
            </div>
          </ScrollArea>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Update the flight section in the main component
  const renderFlightSection = () => (
    <div className="p-2 border rounded-md space-y-1 bg-card">
      <h2 className="text-xs font-semibold text-foreground">Flight</h2>
      {loadingFlights ? (
        <div className="text-xs text-muted-foreground">Loading flights...</div>
      ) : (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-auto p-2 relative group hover:border-primary transition-colors text-left flex justify-start"
            onClick={() => setShowFlightDialog(true)}
          >
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors">
              <Plane className="h-4 w-4 text-primary" />
            </div>
            {selectedFlight ? (
              <div className="flex flex-col items-start gap-1 pr-8">
                <span className="text-sm font-medium">
                  {selectedFlight.airline} • {selectedFlight.class}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedFlight.from_location}
                </span>
              </div>
            ) : selectedLocation === "none" ? (
              <div className="flex flex-col items-start gap-1 pr-8">
                <span className="text-sm font-medium">No Flights Selected</span>
                <span className="text-xs text-muted-foreground">Click to change selection</span>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1 pr-8">
                <span className="text-sm font-medium">Select Flight</span>
                <span className="text-xs text-muted-foreground">Choose from available flights</span>
              </div>
            )}
          </Button>

          {renderFlightDialog()}
          {selectedFlight && renderFlightInfo(selectedFlight)}
        </div>
      )}
    </div>
  );

  if (loadingEvents) {
    return <div className="p-8">Loading events...</div>;
  }

  return (
    <div className="p-4 space-y-4 bg-card rounded-md border shadow-sm w-full mx-auto">
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
                <SelectItem 
                  key={event.event_id} 
                  value={event.event_id}
                  disabled={event.status === "sales closed"}
                  className={event.status === "sales closed" ? "text-muted-foreground opacity-50" : ""}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{event.event || event.event_name}</span>
                    {event.status === "sales closed" && (
                      <span className="text-xs text-muted-foreground">Sales Closed</span>
                    )}
                  </div>
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
                      <SelectItem 
                        key={idx} 
                        value={pkg.package_id}
                        disabled={pkg.status === "sales closed"}
                        className={pkg.status === "sales closed" ? "text-muted-foreground opacity-50" : ""}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{pkg.package_name}</span>
                          {pkg.status === "sales closed" && (
                            <span className="text-xs text-muted-foreground">Sales Closed</span>
                          )}
                        </div>
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
                    <SelectItem 
                      key={tier.tier_id} 
                      value={tier.tier_id}
                      disabled={tier.status === "sales closed"}
                      className={tier.status === "sales closed" ? "text-muted-foreground opacity-50" : ""}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{tier.tier_type}</span>
                        {tier.status === "sales closed" && (
                          <span className="text-xs text-muted-foreground">Sales Closed</span>
                        )}
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
                    {hotels
                      .filter(hotel => rooms.some(room => 
                        room.hotel_id === hotel.hotel_id && 
                        room.package_id.split(',').map(id => id.trim()).includes(selectedPackage.package_id)
                      ))
                      .map((hotel) => (
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
                  <div className="flex items-center gap-2">
                    <DatePickerWithRange
                      date={dateRange}
                      setDate={handleDateChange}
                    />
                    {dateRange?.from && dateRange?.to && (
                      <span className="text-sm text-muted-foreground">
                        ({differenceInDays(dateRange.to, dateRange.from)} {differenceInDays(dateRange.to, dateRange.from) === 1 ? 'night' : 'nights'})
                      </span>
                    )}
                  </div>
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
                    value={effectiveRoomQuantity}
                    onChange={setEffectiveRoomQuantity}
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
                      className="w-fit text-xs bg-primary text-primary-foreground"
                    >
                      More Ticket Info
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-6xl p-5 rounded-lg shadow-lg">
                    <DialogHeader>
                      <DialogTitle className="mb-2 text-xl font-semibold text-foreground text-left">
                        {selectedTicket.ticket_name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {/* Carousel Column */}
                      {(selectedTicket.category?.ticket_image_1 || selectedTicket.category?.ticket_image_2) && (
                        <div className="flex justify-center md:justify-start h-full">
                          <div className="relative w-full max-w-xl rounded-md h-full">
                            <Carousel className="w-full h-full rounded-md" setApi={api => {
                              if (api) {
                                api.on('select', () => setCarouselIndex(api.selectedScrollSnap()));
                              }
                            }}>
                              <CarouselContent className="rounded-md h-100">
                                {selectedTicket.category.ticket_image_1 && (
                                  <CarouselItem>
                                    <img
                                      src={selectedTicket.category.ticket_image_1}
                                      alt="Ticket View 1"
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  </CarouselItem>
                                )}
                                {selectedTicket.category.ticket_image_2 && (
                                  <CarouselItem>
                                    <img
                                      src={selectedTicket.category.ticket_image_2}
                                      alt="Ticket View 2"
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  </CarouselItem>
                                )}
                              </CarouselContent>
                              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-background shadow rounded-full" />
                              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-background shadow rounded-full" />
                              {/* Image index indicator */}
                              {(selectedTicket.category.ticket_image_1 && selectedTicket.category.ticket_image_2) && (
                                <div className="absolute top-4 left-16 -translate-x-1/2 bg-primary font-bold text-primary-foreground text-xs px-3 py-1 rounded-md z-10">
                                  Image {carouselIndex + 1} of 2
                                </div>
                              )}
                            </Carousel>
                          </div>
                        </div>
                      )}
                      {/* Info Column */}
                      <div className="space-y-4">
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
                            <div className="mt-4">
                              <div className="flex flex-wrap gap-1">
                                <Badge 
                                  variant={selectedTicket.category.video_wall ? "default" : "outline"} 
                                  className={`flex items-center gap-1 px-2 py-0.5 text-xs ${selectedTicket.category.video_wall ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                                >
                                  <MonitorPlay className="h-3 w-3" />
                                  Video Wall
                                  {selectedTicket.category.video_wall && (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </Badge>
                                <Badge 
                                  variant={selectedTicket.category.covered_seat ? "default" : "outline"} 
                                  className={`flex items-center gap-1 px-2 py-0.5 text-xs ${selectedTicket.category.covered_seat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                                >
                                  <Umbrella className="h-3 w-3" />
                                  Covered Seat
                                  {selectedTicket.category.covered_seat && (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </Badge>
                                <Badge 
                                  variant={selectedTicket.category.numbered_seat ? "default" : "outline"} 
                                  className={`flex items-center gap-1 px-2 py-0.5 text-xs ${selectedTicket.category.numbered_seat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                                >
                                  <Hash className="h-3 w-3" />
                                  Numbered Seat
                                  {selectedTicket.category.numbered_seat && (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <QuantitySelector
                value={effectiveTicketQuantity}
                onChange={setEffectiveTicketQuantity}
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
      {selectedEvent && renderFlightSection()}

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
                value={effectiveLoungePassQuantity}
                onChange={setEffectiveLoungePassQuantity}
                min={1}
                max={10}
              />
            </div>
          )}
        </div>
      )}

      {/* Total Price Section */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <p className="text-sm text-muted-foreground">Total Price</p>
          <h2 className="text-xl font-bold text-foreground">
            {currencySymbols[selectedCurrency]}
            {Number(totalPrice || 0).toFixed(0)}
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

      {/* More Info Section */}
      {(selectedEvent || selectedPackage) && (
        <div className="mt-4 p-4 border rounded-md bg-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground">More Information</h3>
          
          {selectedEvent && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-foreground">Event Consultant</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="text-muted-foreground">Name:</p>
                <p className="text-foreground">{selectedEvent.consultant_name || 'Not specified'}</p>
                <p className="text-muted-foreground">Phone:</p>
                <p className="text-foreground">{selectedEvent.consultant_phone || 'Not specified'}</p>
                <p className="text-muted-foreground">Email:</p>
                <p className="text-foreground">{selectedEvent.consultant_email || 'Not specified'}</p>
              </div>
            </div>
          )}

          {selectedPackage && selectedPackage.url && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-foreground">Package Details</h4>
              <div className="text-xs">
                <p className="text-muted-foreground mb-1">More Information:</p>
                <a 
                  href={selectedPackage.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Package Details
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ExternalPricing.propTypes = {
  numberOfAdults: PropTypes.number,
  setNumberOfAdults: PropTypes.func,
  totalPrice: PropTypes.number,
  setTotalPrice: PropTypes.func,
  setSalesTeam: PropTypes.func,
  selectedEvent: PropTypes.object,
  setSelectedEvent: PropTypes.func,
  selectedPackage: PropTypes.object,
  setSelectedPackage: PropTypes.func,
  selectedHotel: PropTypes.object,
  setSelectedHotel: PropTypes.func,
  selectedRoom: PropTypes.object,
  setSelectedRoom: PropTypes.func,
  selectedTicket: PropTypes.object,
  setSelectedTicket: PropTypes.func,
  selectedFlight: PropTypes.object,
  setSelectedFlight: PropTypes.func,
  selectedLoungePass: PropTypes.object,
  setSelectedLoungePass: PropTypes.func,
  selectedCircuitTransfer: PropTypes.object,
  setSelectedCircuitTransfer: PropTypes.func,
  selectedAirportTransfer: PropTypes.object,
  setSelectedAirportTransfer: PropTypes.func,
  circuitTransferQuantity: PropTypes.number,
  setCircuitTransferQuantity: PropTypes.func,
  airportTransferQuantity: PropTypes.number,
  setAirportTransferQuantity: PropTypes.func,
  roomQuantity: PropTypes.number,
  setRoomQuantity: PropTypes.func,
  ticketQuantity: PropTypes.number,
  setTicketQuantity: PropTypes.func,
  loungePassQuantity: PropTypes.number,
  setLoungePassQuantity: PropTypes.func,
  dateRange: PropTypes.object,
  setDateRange: PropTypes.func,
  selectedCurrency: PropTypes.string,
  setSelectedCurrency: PropTypes.func,
  flightQuantity: PropTypes.number,
  setFlightQuantity: PropTypes.func,
};

export { ExternalPricing };
