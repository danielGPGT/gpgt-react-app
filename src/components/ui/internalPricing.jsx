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
import { MonitorPlay, Umbrella, Hash, CheckCircle, X } from "lucide-react";
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
import { BookingForm } from "@/components/ui/bookingForm";
import PropTypes from "prop-types";
import QuotePDF from "./QuotePDF";
import { FileText } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { CategoriesTable } from "@/components/ui/categoriesTable";

function InternalPricing({
  numberOfAdults,
  setNumberOfAdults,
  totalPrice,
  setTotalPrice,
  selectedCurrency,
  setSelectedCurrency,
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
  roomQuantity,
  setRoomQuantity,
  ticketQuantity,
  setTicketQuantity,
  loungePassQuantity,
  setLoungePassQuantity,
  circuitTransferQuantity,
  setCircuitTransferQuantity,
  airportTransferQuantity,
  setAirportTransferQuantity,
  dateRange,
  setDateRange,
  originalNights,
  setOriginalNights,
  flightQuantity,
  setFlightQuantity,
  salesTeam,
}) {
  const { theme } = useTheme();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [packageTiers, setPackageTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

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

  const [showFlightDialog, setShowFlightDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userPhone, setUserPhone] = useState("");

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
  const [exchangeRate, setExchangeRate] = useState(1);

  const [transferDirection, setTransferDirection] = useState("both");

  async function fetchExchangeRate(base = "GBP", target = "USD") {
    const res = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_9rR1LhiOwndKNXxJ62JGHbd294ispnSSTBBFHWFz&base_currency=${base}`
    );
    const data = await res.json();
    return data.data[target];
  }

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

    const rounded = Math.ceil(total / 100) * 100 - 2;
    setTotalPrice(rounded * exchangeRate);
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
    if (!range?.from || !range?.to) {
      setDateRange(range);
      return;
    }
    
    // Ensure the dates are valid Date objects
    const from = new Date(range.from);
    const to = new Date(range.to);
    
    // Set the new date range
    setDateRange({
      from,
      to
    });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/event");
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

  // Update filtered events when sport selection changes
  useEffect(() => {
    if (selectedSport === "all") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.sport === selectedSport));
    }
  }, [selectedSport, events]);

  // Pre-fill date range when selectedRoom changes
  useEffect(() => {
    if (selectedRoom?.check_in_date && selectedRoom?.check_out_date) {
      const from = parse(selectedRoom.check_in_date, "dd/MM/yyyy", new Date());
      const to = parse(selectedRoom.check_out_date, "dd/MM/yyyy", new Date());

      setDateRange({ from, to });
      const nights = differenceInCalendarDays(to, from);
      setOriginalNights(nights);
    }
  }, [selectedRoom, setOriginalNights]);

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
        const [packagesRes, categoriesRes] = await Promise.all([
          api.get("/packages", {
            params: { eventId: foundEvent.event_id },
          }),
          api.get("/categories", {
            params: { eventId: foundEvent.event_id },
          })
        ]);
        setPackages(packagesRes.data);
        setCategories(categoriesRes.data);

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
        setLoadingCategories(false);
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
      setCategories([]);
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
    setCategories([]);

    if (foundPackage) {
      try {
        setLoadingTiers(true);
        setLoadingHotels(true);
        setLoadingTickets(true);
        setLoadingCategories(true);
        
        // Fetch package tiers, hotels, tickets, and categories in parallel
        const [tiersRes, hotelsRes, ticketsRes, categoriesRes] = await Promise.all([
          api.get("/package-tiers", {
            params: { packageId: foundPackage.package_id },
          }),
          api.get("/hotels", {
            params: { packageId: foundPackage.package_id },
          }),
          api.get("/new tickets", {
            params: { packageId: foundPackage.package_id },
          }),
          api.get("/categories", {
            params: { eventId: selectedEvent.event_id },
          })
        ]);

        console.log('Fetched Categories:', categoriesRes.data);
        console.log('Fetched Tickets:', ticketsRes.data);
        console.log('Package ID:', foundPackage.package_id);
        console.log('Event ID:', selectedEvent.event_id);

        setPackageTiers(tiersRes.data);
        setHotels(hotelsRes.data);
        setTickets(ticketsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error("Failed to fetch package data:", error.message);
        toast.error("Failed to load package data. Please try again.");
      } finally {
        setLoadingTiers(false);
        setLoadingHotels(false);
        setLoadingTickets(false);
        setLoadingCategories(false);
      }
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
        // Set all the selections based on the tier data
        if (selectedTierData.ticket_id) {
          const ticket = tickets.find((t) => t.ticket_id === selectedTierData.ticket_id);
          if (ticket) {
            if (parseInt(ticket.remaining) <= 0) {
              // Find next available ticket
              const nextAvailableTicket = tickets.find(t => parseInt(t.remaining) > 0);
              if (nextAvailableTicket) {
                // Find the corresponding category for the next available ticket
                const ticketCategory = categories.find(cat => cat.category_id === nextAvailableTicket.category_id);
                const ticketWithCategory = {
                  ...nextAvailableTicket,
                  category: ticketCategory
                };
                setSelectedTicket(ticketWithCategory);
                setTicketQuantity(numberOfAdults);
                toast.success(`Selected ticket was sold out. Automatically selected next available ticket: ${nextAvailableTicket.ticket_name}`);
              } else {
                toast.error("No available tickets found");
              }
            } else {
              // Find the corresponding category for the selected ticket
              const ticketCategory = categories.find(cat => cat.category_id === ticket.category_id);
              const ticketWithCategory = {
                ...ticket,
                category: ticketCategory
              };
              setSelectedTicket(ticketWithCategory);
              setTicketQuantity(numberOfAdults);
            }
          }
        }

        if (selectedTierData.hotel_id) {
          const hotel = hotels.find((h) => h.hotel_id === selectedTierData.hotel_id);
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
                const room = roomsRes.data.find((r) => r.room_id === selectedTierData.room_id);
                if (room) {
                  if (parseInt(room.remaining) <= 0) {
                    // Find next available room
                    const nextAvailableRoom = roomsRes.data.find(r => parseInt(r.remaining) > 0);
                    if (nextAvailableRoom) {
                      setSelectedRoom(nextAvailableRoom);
                      if (nextAvailableRoom.check_in_date && nextAvailableRoom.check_out_date) {
                        const from = parse(nextAvailableRoom.check_in_date, "dd/MM/yyyy", new Date());
                        const to = parse(nextAvailableRoom.check_out_date, "dd/MM/yyyy", new Date());
                        setDateRange({ from, to });
                        const nights = differenceInCalendarDays(to, from);
                        setOriginalNights(nights);
                      }
                      toast.success(`Selected room was sold out. Automatically selected next available room: ${nextAvailableRoom.room_category} - ${nextAvailableRoom.room_type}`);
                    } else {
                      toast.error("No available rooms found");
                    }
                  } else {
                    setSelectedRoom(room);
                    if (room.check_in_date && room.check_out_date) {
                      const from = parse(room.check_in_date, "dd/MM/yyyy", new Date());
                      const to = parse(room.check_out_date, "dd/MM/yyyy", new Date());
                      setDateRange({ from, to });
                      const nights = differenceInCalendarDays(to, from);
                      setOriginalNights(nights);
                    }
                  }
                }
              }

              // Set transfers if specified in tier
              if (selectedTierData.circuit_transfer_id) {
                const circuitTransfer = circuitRes.data.find(
                  (t) => t.circuit_transfer_id === selectedTierData.circuit_transfer_id
                );
                if (circuitTransfer) {
                  setSelectedCircuitTransfer(circuitTransfer);
                  setCircuitTransferQuantity(ticketQuantity);
                }
              }

              if (selectedTierData.airport_transfer_id) {
                const airportTransfer = airportRes.data.find(
                  (t) => t.airport_transfer_id === selectedTierData.airport_transfer_id
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
      setSelectedAirportTransfer(null);
      setDateRange({ from: null, to: null });
      setOriginalNights(0);
      setCircuitTransferQuantity(0);
      setAirportTransferQuantity(0);
      setCircuitTransfers([]);
      setAirportTransfers([]);
      return;
    }

    const foundHotel = hotels.find((hotel) => hotel.hotel_id === hotelId);
    setSelectedHotel(foundHotel);

    // Reset dependent states
    setSelectedRoom(null);
    setSelectedCircuitTransfer(null);
    setSelectedAirportTransfer(null);
    setDateRange({ from: null, to: null });
    setOriginalNights(0);
    setCircuitTransferQuantity(0);
    setAirportTransferQuantity(0);

    if (foundHotel) {
      try {
        setLoadingRooms(true);
        setLoadingCircuitTransfers(true);
        setLoadingAirportTransfers(true);

        // Fetch rooms and transfers in parallel
        const [roomsRes, circuitRes, airportRes] = await Promise.all([
          api.get("/rooms", {
            params: { hotelId: foundHotel.hotel_id },
          }),
          api.get("/circuit-transfers", {
            params: { hotelId: foundHotel.hotel_id },
          }),
          api.get("/airport-transfers", {
            params: { hotelId: foundHotel.hotel_id },
          }),
        ]);

        setRooms(roomsRes.data);
        setCircuitTransfers(circuitRes.data);
        setAirportTransfers(airportRes.data);

        console.log('Fetched circuit transfers:', circuitRes.data);
        console.log('Fetched airport transfers:', airportRes.data);

      } catch (error) {
        console.error("Failed to fetch hotel data:", error.message);
        toast.error("Failed to load hotel data. Please try again.");
      } finally {
        setLoadingRooms(false);
        setLoadingCircuitTransfers(false);
        setLoadingAirportTransfers(false);
      }
    }
  };

  const handleRoomSelect = async (roomId) => {
    if (roomId === "none") {
      setSelectedRoom(null);
      setDateRange({ from: null, to: null });
      setOriginalNights(0);
      return;
    }

    const foundRoom = rooms.find((room) => room.room_id === roomId);
    setSelectedRoom(foundRoom);

    // Reset room quantity if current quantity is greater than available rooms
    if (foundRoom && roomQuantity > parseInt(foundRoom.remaining)) {
      setRoomQuantity(1);
    }

    if (foundRoom?.check_in_date && foundRoom?.check_out_date) {
      const from = parse(foundRoom.check_in_date, "dd/MM/yyyy", new Date());
      const to = parse(foundRoom.check_out_date, "dd/MM/yyyy", new Date());
      setDateRange({ from, to });
      const nights = differenceInCalendarDays(to, from);
      setOriginalNights(nights);
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
    if (foundTicket) {
      console.log('Selected Ticket:', foundTicket);
      console.log('Available Categories:', categories);
      console.log('Ticket Category ID:', foundTicket.category_id);
      
      // Find the corresponding category
      const ticketCategory = categories.find(cat => cat.category_id === foundTicket.category_id);
      console.log('Found Category:', ticketCategory);
      
      if (!ticketCategory) {
        console.warn('No matching category found for ticket:', foundTicket);
      }
      
      // Merge category information with ticket
      const ticketWithCategory = {
        ...foundTicket,
        category: ticketCategory
      };
      console.log('Ticket with Category:', ticketWithCategory);
      
      setSelectedTicket(ticketWithCategory);
      setTicketQuantity(numberOfAdults);
      if (selectedCircuitTransfer) {
        setCircuitTransferQuantity(numberOfAdults);
      }
    }
  };

  const handleCircuitTransferSelect = async (transferId) => {
    if (transferId === "none") {
      setSelectedCircuitTransfer(null);
      setCircuitTransferQuantity(0);
      return;
    }

    const foundTransfer = circuitTransfers.find(
      (transfer) => transfer.circuit_transfer_id === transferId
    );
    setSelectedCircuitTransfer(foundTransfer);
    setCircuitTransferQuantity(ticketQuantity);
  };

  const handleAirportTransferSelect = async (transferId) => {
    if (transferId === "none") {
      setSelectedAirportTransfer(null);
      setAirportTransferQuantity(0);
      return;
    }

    const foundTransfer = airportTransfers.find(
      (transfer) => transfer.airport_transfer_id === transferId
    );
    setSelectedAirportTransfer(foundTransfer);
    const needed = Math.ceil(
      numberOfAdults / (foundTransfer.max_capacity || 1)
    );
    setAirportTransferQuantity(needed);
  };

  const handleFlightSelect = async (flightId) => {
    if (flightId === "none") {
      setSelectedFlight(null);
      setFlightQuantity(0);
      return;
    }

    const foundFlight = flights.find((flight) => flight.flight_id === flightId);
    setSelectedFlight(foundFlight);
    setFlightQuantity(numberOfAdults);
  };

  const handleLoungePassSelect = (passId) => {
    if (passId === "none") {
      setSelectedLoungePass(null);
      setLoungePassQuantity(0);
      return;
    }

    const foundPass = loungePasses.find(
      (pass) => pass.lounge_pass_id === passId
    );
    setSelectedLoungePass(foundPass);
    setLoungePassQuantity(1);
  };

  // Update quantities when numberOfAdults changes
  useEffect(() => {
    if (selectedTicket) {
      setTicketQuantity(numberOfAdults);
    }

    if (selectedAirportTransfer) {
      const needed = Math.ceil(
        numberOfAdults / (selectedAirportTransfer.max_capacity || 1)
      );
      setAirportTransferQuantity(needed);
    }

    if (selectedFlight) {
      setFlightQuantity(numberOfAdults);
    }
  }, [
    numberOfAdults,
    selectedTicket,
    selectedAirportTransfer,
    selectedFlight,
  ]);

  // Update circuit transfer quantity when ticket quantity changes
  useEffect(() => {
    if (selectedCircuitTransfer) {
      setCircuitTransferQuantity(ticketQuantity);
    }
  }, [ticketQuantity, selectedCircuitTransfer]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email);
        setUserAvatar(decoded.avatar || '');
        setUserPhone(decoded.phone || '');
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  if (loadingEvents) {
    return <div className="p-8">Loading events...</div>;
  }

  return (
    <div className="p-4  bg-card rounded-md border shadow-sm w-full mx-auto h-full flex flex-row gap-4">
      {/* Event & Package */}
      <div className="space-y-3 w-8/12">
        {/* Sport and Event Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h2 className="text-xs font-semibold mb-1 text-foreground">Select Sport</h2>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-full h-9 text-sm bg-background relative group hover:border-primary transition-colors">
                <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                  <Trophy className="h-4 w-4 text-primary" />
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
            <h2 className="text-xs font-semibold mb-1 text-foreground">Select Event</h2>
            <Select onValueChange={handleEventSelect}>
              <SelectTrigger className="w-full h-9 text-sm bg-background relative group hover:border-primary transition-colors">
                <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                  <CalendarDays className="h-4 w-4 text-primary" />
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
        </div>

        {/* Package and Tier Selection */}
        {selectedEvent && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h2 className="text-xs font-semibold mb-1 text-foreground">Select Package</h2>
              {loadingPackages ? (
                <div className="text-xs text-muted-foreground">Loading packages...</div>
              ) : (
                <Select onValueChange={handlePackageSelect} value={selectedPackage?.package_id}>
                  <SelectTrigger className="w-full bg-background relative group hover:border-primary transition-colors">
                    <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                      <Package className="h-4 w-4 text-primary" />
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
              )}
            </div>
            {selectedPackage && (
              <div>
                <h2 className="text-xs font-semibold mb-1 text-foreground">Select Tier</h2>
                {loadingTiers ? (
                  <div className="text-xs text-muted-foreground">Loading tiers...</div>
                ) : (
                  <Select onValueChange={handleTierSelect} value={selectedTier?.tier_id}>
                    <SelectTrigger className="w-full bg-background relative group hover:border-primary transition-colors">
                      <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                        <Layers className="h-4 w-4" />
                      </div>
                      <SelectValue placeholder="Choose a tier...">
                        {selectedTier ? (
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{selectedTier.tier_type}</span>
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
                          {tier.tier_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        )}

        {/* Categories Table */}
        {selectedPackage && (
          <div className="mt-4">
            <h2 className="text-xs font-semibold mb-2 text-foreground">Categories</h2>
            <CategoriesTable 
              eventId={selectedEvent?.event_id} 
              packageId={selectedPackage?.package_id} 
            />
          </div>
        )}

        {/* Hotel and Adults */}
        {selectedPackage && (
          <div className="flex justify-between items-end gap-4">
            <div className="flex-col w-6/12">
              <h2 className="text-xs font-semibold mb-1 text-foreground">Select Hotel</h2>
              {loadingHotels ? (
                <div className="text-xs text-muted-foreground">Loading hotels...</div>
              ) : (
                <Select onValueChange={(id) => handleHotelSelect(id)} value={selectedHotel?.hotel_id}>
                  <SelectTrigger className="w-full h-9 text-sm bg-background relative group hover:border-primary transition-colors">
                    <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                      <Hotel className="h-4 w-4 text-primary" />
                    </div>
                    <SelectValue placeholder="Choose hotel">
                      {selectedHotel ? selectedHotel.hotel_name : "Choose hotel"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.hotel_id} value={hotel.hotel_id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{hotel.hotel_name}</span>
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
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold">Adults</h2>
              <QuantitySelector
                value={numberOfAdults}
                onChange={setNumberOfAdults}
                min={1}
                max={100}
              />
            </div>
          </div>
        )}

        

        {/* Room Selection */}
        {selectedHotel && (
          <div className="p-2 border rounded-md space-y-1 bg-card">
            <h2 className="text-xs font-semibold text-foreground">Select Room</h2>
            {loadingRooms ? (
              <div className="text-xs text-muted-foreground">Loading rooms...</div>
            ) : (
              <Select onValueChange={handleRoomSelect} value={selectedRoom?.room_id}>
                <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                  <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                    <Bed className="h-4 w-4 text-primary" />
                  </div>
                  <SelectValue placeholder="Choose a room...">
                    {selectedRoom ? `${selectedRoom.room_category} - ${selectedRoom.room_type}` : "Choose a room..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.room_id} value={room.room_id} className="text-xs" disabled={parseInt(room.remaining) <= 0}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{room.room_category} - {room.room_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {parseInt(room.remaining) > 0 ? `${room.remaining} rooms left` : "Sold Out"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedRoom && (
              <div className="flex justify-between gap-3 pt-2 text-xs align-bottom items-end">
                <div className="space-y-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-fit text-xs bg-primary text-primary-foreground">
                        More Room info
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="mb-2 text-foreground">
                          {selectedRoom.room_category} - {selectedRoom.room_type}
                        </DialogTitle>
                        <DialogDescription>
                          Room details for <strong className="text-foreground">{selectedRoom.hotel_name}</strong>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="text-sm text-muted-foreground mt-2 space-y-2">
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
                    </DialogContent>
                  </Dialog>
                  <div className="pt-2">
                    <p className="font-semibold mb-1 text-foreground">Check in - Check out:</p>
                    <DatePickerWithRange date={dateRange} setDate={handleDateChange} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
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
            )}
          </div>
        )}

        {/* Ticket Selection */}
        {selectedPackage && (
          <div className="p-2 border rounded-md space-y-1 bg-card">
            <h2 className="text-xs font-semibold text-foreground">Select Ticket</h2>
            {loadingTickets ? (
              <div className="text-xs text-muted-foreground">Loading tickets...</div>
            ) : (
              <Select onValueChange={handleTicketSelect} value={selectedTicket?.ticket_id}>
                <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                  <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <SelectValue placeholder="Choose ticket">
                    {selectedTicket ? selectedTicket.ticket_name : "Choose ticket"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Ticket</SelectItem>
                  {tickets.map((ticket) => (
                    <SelectItem
                      key={ticket.ticket_id}
                      value={ticket.ticket_id}
                      disabled={parseInt(ticket.remaining) <= 0 && ticket.remaining !== "purchased_to_order"}
                      className={`text-xs ${parseInt(ticket.remaining) <= 0 && ticket.remaining !== "purchased_to_order" ? "text-muted-foreground" : ""}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ticket.ticket_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {ticket.ticket_type} • {
                            ticket.remaining === "purchased_to_order" 
                              ? "Purchased to Order"
                              : parseInt(ticket.remaining) > 0
                                ? `${ticket.remaining} tickets left`
                                : "Sold Out"
                          }
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedTicket && (
              <div className="text-xs space-y-1 mt-4 flex justify-between">
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-fit text-xs bg-primary text-primary-foreground">
                      More Ticket Info
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="mb-4 text-foreground">
                        {selectedTicket.ticket_name}
                      </DialogTitle>

                    </DialogHeader>
                    <div className="text-sm text-muted-foreground mt-2 space-y-4">
                      {/* Ticket Information */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Ticket Information</h3>
                        <div className="grid grid-cols-2 gap-2">
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
                        <div className="space-y-2">
                          <h3 className="font-semibold text-foreground">Category Information</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <p className="font-medium text-foreground">Delivery Days:</p>
                            <p>{selectedTicket.category.ticket_delivery_days} days</p>
                          </div>

                          {/* Category Features */}
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">Features:</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge 
                                variant={selectedTicket.category.video_wall ? "default" : "outline"} 
                                className={`flex items-center gap-1 ${selectedTicket.category.video_wall ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                              >
                                <MonitorPlay className="h-3 w-3" />
                                Video Wall
                                {selectedTicket.category.video_wall && (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Badge>
                              <Badge 
                                variant={selectedTicket.category.covered_seat ? "default" : "outline"} 
                                className={`flex items-center gap-1 ${selectedTicket.category.covered_seat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                              >
                                <Umbrella className="h-3 w-3" />
                                Covered Seat
                                {selectedTicket.category.covered_seat && (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Badge>
                              <Badge 
                                variant={selectedTicket.category.numbered_seat ? "default" : "outline"} 
                                className={`flex items-center gap-1 ${selectedTicket.category.numbered_seat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                              >
                                <Hash className="h-3 w-3" />
                                Numbered Seat
                                {selectedTicket.category.numbered_seat && (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Badge>
                            </div>
                          </div>

                          {/* Additional Category Info */}
                          {selectedTicket.category.category_info && (
                            <div className="space-y-2">
                              <p className="font-medium text-foreground">Additional Information:</p>
                              <p className="text-sm">{selectedTicket.category.category_info}</p>
                            </div>
                          )}

                          {/* Category Images */}
                          {(selectedTicket.category.ticket_image_1 || selectedTicket.category.ticket_image_2) && (
                            <div className="space-y-2">
                              <p className="font-medium text-foreground">Ticket Images:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {selectedTicket.category.ticket_image_1 && (
                                  <img 
                                    src={selectedTicket.category.ticket_image_1} 
                                    alt="Ticket View 1" 
                                    className="rounded-md w-full h-auto"
                                  />
                                )}
                                {selectedTicket.category.ticket_image_2 && (
                                  <img 
                                    src={selectedTicket.category.ticket_image_2} 
                                    alt="Ticket View 2" 
                                    className="rounded-md w-full h-auto"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="flex items-center gap-2">
                  <p className="text-foreground">Quantity:</p>
                  <QuantitySelector
                    value={ticketQuantity}
                    onChange={setTicketQuantity}
                    min={1}
                    max={parseInt(selectedTicket.remaining) || 100}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transfers */}
        {selectedHotel && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 border rounded-md space-y-1 bg-card">
              <h2 className="text-xs font-semibold text-foreground">Circuit Transfer</h2>
              {loadingCircuitTransfers ? (
                <div className="text-xs text-muted-foreground">Loading...</div>
              ) : (
                <Select onValueChange={handleCircuitTransferSelect} value={selectedCircuitTransfer?.circuit_transfer_id}>
                  <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                    <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                      <Bus className="h-4 w-4 text-primary" />
                    </div>
                    <SelectValue placeholder="Select circuit transfer">
                      {selectedCircuitTransfer ? selectedCircuitTransfer.transport_type : "Select circuit transfer"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {circuitTransfers && circuitTransfers.map((transfer) => (
                      <SelectItem key={transfer.circuit_transfer_id} value={transfer.circuit_transfer_id} className="text-xs">
                        {transfer.transport_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="p-2 border rounded-md space-y-1 bg-card">
              <h2 className="text-xs font-semibold text-foreground">Airport Transfer</h2>
              {loadingAirportTransfers ? (
                <div className="text-xs text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-2">
                  <Select onValueChange={handleAirportTransferSelect} value={selectedAirportTransfer?.airport_transfer_id}>
                    <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                      <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                        <Bus className="h-4 w-4 text-primary" />
                      </div>
                      <SelectValue placeholder="Select airport transfer">
                        {selectedAirportTransfer ? selectedAirportTransfer.transport_type : "Select airport transfer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {airportTransfers && airportTransfers.map((transfer) => (
                        <SelectItem key={transfer.airport_transfer_id} value={transfer.airport_transfer_id} className="text-xs">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{transfer.transport_type}</span>
                            <span className="text-xs text-muted-foreground">
                              (Max {transfer.max_capacity} people)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedAirportTransfer && (
                    <div className="space-y-2">
                      <Select value={transferDirection} onValueChange={setTransferDirection}>
                        <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                          <SelectValue placeholder="Select transfer direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">Inbound & Outbound</SelectItem>
                          <SelectItem value="inbound_only">Inbound Only</SelectItem>
                          <SelectItem value="outbound_only">Outbound Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs pt-1">
                        Transfers Needed: {Math.ceil(numberOfAdults / (selectedAirportTransfer.max_capacity || 1))}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flight Selection */}
        {selectedEvent && (
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
                        {selectedFlight.outbound_flight.split(" ")[0]} - {selectedFlight.inbound_flight.split(" ")[0]}
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
                            setFlightQuantity(0);
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
                                          {flight.price * numberOfAdults}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {currencySymbols[selectedCurrency]}
                                          {flight.price} per person
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
              </div>
            )}

            {selectedFlight && (
              <div className="text-xs space-y-1 pt-1">
                <p className="text-foreground">Outbound: {selectedFlight.outbound_flight}</p>
                <p className="text-foreground">Inbound: {selectedFlight.inbound_flight}</p>
                <p className="text-foreground">
                  Total Price: {currencySymbols[selectedCurrency]}
                  {selectedFlight.price * numberOfAdults}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lounge Pass */}
        {selectedEvent && (
          <div className="p-2 border rounded-md space-y-1 bg-card">
            <h2 className="text-xs font-semibold text-foreground">Lounge Pass</h2>
            {loadingLoungePasses ? (
              <div className="text-xs text-muted-foreground">Loading lounge passes...</div>
            ) : (
              <Select onValueChange={handleLoungePassSelect}>
                <SelectTrigger className="w-full h-8 text-xs bg-background relative group hover:border-primary transition-colors">
                  <div className="absolute right-8 text-muted-foreground group-hover:text-primary transition-colors">
                    <Coffee className="h-4 w-4 text-primary" />
                  </div>
                  <SelectValue placeholder="Select lounge pass" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {loungePasses.map((lp) => (
                    <SelectItem key={lp.lounge_pass_id} value={lp.lounge_pass_id}>
                      {lp.variant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedLoungePass && (
              <div className="text-xs space-y-1 pt-1">

                <div className="flex items-center gap-2">
                  <p className="text-foreground">Quantity:</p>
                  <QuantitySelector
                    value={loungePassQuantity}
                    onChange={setLoungePassQuantity}
                    min={1}
                    max={100}
                  />
                </div>

              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-4/12 border rounded-md border-primary p-6 bg-background h-full sticky top-4">
        {/* Empty State */}
        {!selectedRoom && !selectedTicket && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <Package className="h-12 w-12 text-primary" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">No Items Selected</h3>
              <p className="text-sm text-muted-foreground">
                Select a room or ticket to see pricing details and create a booking
              </p>
            </div>
          </div>
        )}

        {/* Total Price */}
        {(selectedRoom || selectedTicket) && (
          <div className="space-y-4">
            {/* Total Price Section */}
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

            {/* Selected Items */}
            <div className="space-y-2">
              {selectedRoom && (
                <div className="flex items-center justify-between text-muted-foreground bg-card p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <Bed className="h-4 w-4 text-primary" />
                    <span className="text-sm">{selectedHotel.hotel_name} - {selectedRoom.room_category} - {selectedRoom.room_type}</span>
                  </div>
                  <span className="text-sm font-medium">x{roomQuantity}</span>
                </div>
              )}
              {selectedTicket && (
                <div className="flex items-center justify-between text-muted-foreground bg-card p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-4 w-4 text-primary" />
                    <span className="text-sm">{selectedTicket.ticket_name}</span>
                  </div>
                  <span className="text-sm font-medium">x{ticketQuantity}</span>
                </div>
              )}
              {selectedFlight && (
                <div className="flex items-center justify-between text-muted-foreground bg-card p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <Plane className="h-4 w-4 text-primary" />
                    <span className="text-sm">{selectedFlight.airline} • {selectedFlight.class}</span>
                  </div>
                  <span className="text-sm font-medium">x{flightQuantity}</span>
                </div>
              )}
              {selectedLoungePass && (
                <div className="flex items-center justify-between text-muted-foreground bg-card p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <Coffee className="h-4 w-4 text-primary" />
                    <span className="text-sm">{selectedLoungePass.variant}</span>
                  </div>
                  <span className="text-sm font-medium">x{loungePassQuantity}</span>
                </div>
              )}
              {selectedCircuitTransfer && (
                <div className="flex items-center justify-between text-muted-foreground bg-card p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <Bus className="h-4 w-4 text-primary" />
                    <span className="text-sm">Circuit Transfer - {selectedCircuitTransfer.transport_type}</span>
                  </div>
                  <span className="text-sm font-medium">x{circuitTransferQuantity}</span>
                </div>
              )}
              {selectedAirportTransfer && (
                <div className="flex items-center justify-between text-muted-foreground bg-card p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <Bus className="h-4 w-4 text-primary" />
                    <span className="text-sm">Airport Transfer - {selectedAirportTransfer.transport_type}</span>
                  </div>
                  <span className="text-sm font-medium">x{airportTransferQuantity}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                className="w-full"
                onClick={() => setShowBookingForm(true)}
              >
                Create Booking
              </Button>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => setShowQuote(true)}
              >
                <FileText className="mr-2 h-4 w-4 text-primary" />
                Generate Quote
              </Button>
            </div>
          </div>
        )}
      </div>

      <BookingForm
        open={showBookingForm}
        onOpenChange={setShowBookingForm}
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
        dateRange={dateRange}
        numberOfAdults={numberOfAdults}
        totalPrice={totalPrice}
        selectedCurrency={selectedCurrency}
        transferDirection={transferDirection}
      />

      <Dialog open={showQuote} onOpenChange={setShowQuote}>
        <DialogContent className="w-[95vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Quote</DialogTitle>
          </DialogHeader>
          <QuotePDF
            selectedEvent={selectedEvent}
            selectedPackage={selectedPackage}
            selectedTier={selectedTier}
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
            dateRange={dateRange}
            numberOfAdults={numberOfAdults}
            totalPrice={totalPrice}
            selectedCurrency={selectedCurrency}
            userEmail={userEmail}
            userAvatar={userAvatar}
            userPhone={userPhone}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

InternalPricing.propTypes = {
  numberOfAdults: PropTypes.number,
  setNumberOfAdults: PropTypes.func,
  totalPrice: PropTypes.number,
  setTotalPrice: PropTypes.func,
  selectedCurrency: PropTypes.string,
  setSelectedCurrency: PropTypes.func,
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
  roomQuantity: PropTypes.number,
  setRoomQuantity: PropTypes.func,
  ticketQuantity: PropTypes.number,
  setTicketQuantity: PropTypes.func,
  loungePassQuantity: PropTypes.number,
  setLoungePassQuantity: PropTypes.func,
  circuitTransferQuantity: PropTypes.number,
  setCircuitTransferQuantity: PropTypes.func,
  airportTransferQuantity: PropTypes.number,
  setAirportTransferQuantity: PropTypes.func,
  dateRange: PropTypes.object,
  setDateRange: PropTypes.func,
  originalNights: PropTypes.number,
  setOriginalNights: PropTypes.func,
  flightQuantity: PropTypes.number,
  setFlightQuantity: PropTypes.func,
  salesTeam: PropTypes.object,
};

export { InternalPricing };
