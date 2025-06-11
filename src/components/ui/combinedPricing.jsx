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
  Info,
  User,
  Link,
  ExternalLink,
} from "lucide-react";
import { parse } from "date-fns";
import { differenceInCalendarDays, differenceInDays } from "date-fns";
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { BookingConfirmationPDF } from "./BookingConfirmationPDF";
import { RequestBooking } from "@/components/ui/requestBooking";

function CombinedPricing({
  numberOfAdults,
  setNumberOfAdults,
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
  userRole,
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
  const [showRequestBooking, setShowRequestBooking] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [b2bCommission, setB2bCommission] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [spread, setSpread] = useState(0);
  const [transferDirection, setTransferDirection] = useState("both");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isExternalView, setIsExternalView] = useState(userRole === "External B2B");
  const isAdmin = userRole === "Admin";
  const [totalPrice, setTotalPrice] = useState(0);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [exchangeRates, setExchangeRates] = useState({
    GBP: { GBP: 1, USD: 1.25, EUR: 1.15, AUD: 1.90, CAD: 1.70 },
    USD: { GBP: 0.80, USD: 1, EUR: 0.92, AUD: 1.52, CAD: 1.36 },
    EUR: { GBP: 0.87, USD: 1.09, EUR: 1, AUD: 1.65, CAD: 1.48 },
    AUD: { GBP: 0.53, USD: 0.66, EUR: 0.61, AUD: 1, CAD: 0.89 },
    CAD: { GBP: 0.59, USD: 0.74, EUR: 0.68, AUD: 1.12, CAD: 1 }
  });

  const minNights = selectedRoom?.nights || 1;
  const availableCurrencies = ["GBP", "USD", "EUR", "AUD", "CAD"];
  const currencySymbols = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
  };

  // Determine effective role for pricing calculations
  const effectiveRole = isAdmin ? (isExternalView ? "External B2B" : "Internal Sales") : userRole;

  // Fetch B2B commission for external users
  useEffect(() => {
    const fetchB2bCommission = async () => {
      if (effectiveRole === "External B2B") {
        try {
          const res = await api.get("/b2b-commission");
          if (res.data && res.data.length > 0) {
            setB2bCommission(Number(res.data[0].b2b_commision) / 100);
          }
        } catch (error) {
          console.error("Failed to fetch B2B commission:", error);
          setB2bCommission(0.1); // Default to 10% if fetch fails
        }
      }
    };
    fetchB2bCommission();
  }, [effectiveRole]);

  // Fetch spread for currency conversion
  useEffect(() => {
    const fetchSpread = async () => {
      try {
        const res = await api.get("/fx-spread");
        if (res.data && res.data.length > 0) {
          setSpread(Number(res.data[0].spread));
        }
      } catch (error) {
        console.error("Failed to fetch spread:", error);
        setSpread(0.02); // Default to 2% if fetch fails
      }
    };
    fetchSpread();
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const res = await api.get("/new-fx");
        if (res.data && res.data.length > 0) {
          // Find the rate from GBP to selected currency
          const rate = res.data.find(r => r.from === 'GBP' && r.to === selectedCurrency);
          // Apply spread to the rate (multiply by 1 + spread)
          const adjustedRate = selectedCurrency === "GBP" ? 1 : (rate ? Number(rate.rate) * (1 + spread) : 1);
          setExchangeRate(adjustedRate);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        setExchangeRate(1);
      }
    };
    fetchExchangeRates();
  }, [selectedCurrency, spread]);

  // Total price calculation
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

    // First round to nearest 100 and subtract 2
    const rounded = Math.ceil(total / 100) * 100 - 2;

    // Apply B2B commission and currency conversion
    let finalTotal;
    if (effectiveRole === "External B2B") {
      // For external users, apply commission first, then exchange rate
      const withCommission = rounded * (1 + b2bCommission);
      finalTotal = withCommission * exchangeRate;
    } else {
      // For internal users, just apply exchange rate
      finalTotal = rounded * exchangeRate;
    }

    // Ensure we have a valid number
    if (isNaN(finalTotal)) {
      console.error('Invalid total price calculation:', {
        rounded,
        b2bCommission,
        exchangeRate,
        spread,
        effectiveRole,
        selectedCurrency
      });
      finalTotal = 0;
    }

    setTotalPrice(finalTotal);
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
    effectiveRole,
    selectedCurrency,
  ]);

  // Fetch events and sports
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
        setLoadingFlights(true);
        setLoadingLoungePasses(true);

        const [packagesRes, flightsRes, loungeRes] = await Promise.all([
          api.get("/packages", {
            params: { eventId: foundEvent.event_id },
          }),
          api.get("/flights", { params: { event_id: foundEvent.event_id } }),
          api.get("/lounge-passes", { params: { event_id: foundEvent.event_id } }),
        ]);

        setPackages(packagesRes.data);
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

      // Extract unique hotel IDs from rooms
      const uniqueHotelIds = [...new Set(roomsRes.data.map(room => room.hotel_id))];

      // Get hotels for these IDs
      const hotelsRes = await api.get("/hotels", {
        params: { hotelIds: uniqueHotelIds.join(',') },
      });

      // Get other data in parallel
      const [
        ticketsRes,
        circuitTransfersRes,
        airportTransfersRes,
        tiersRes
      ] = await Promise.all([
        api.get("/tickets", { params: { packageId } }),
        api.get("/circuit-transfers", { params: { packageId } }),
        api.get("/airport-transfers", { params: { packageId } }),
        api.get("/package-tiers", { params: { packageId } })
      ]);

      const packageData = packages.find((p) => p.package_id === packageId);
      setSelectedPackage(packageData);
      setRooms(roomsRes.data);
      setHotels(hotelsRes.data);
      setTickets(ticketsRes.data);
      setCircuitTransfers(circuitTransfersRes.data);
      setAirportTransfers(airportTransfersRes.data);
      setPackageTiers(tiersRes.data);
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

    console.log('Tier Selection Started - Tier ID:', tierId);
    const selectedTierData = packageTiers.find((tier) => tier.tier_id === tierId);
    console.log('Selected Tier Data:', selectedTierData);
    setSelectedTier(selectedTierData);

    if (selectedTierData) {
      try {
        // Set all the selections based on the tier data
        if (selectedTierData.ticket_id) {
          console.log('Processing Ticket Selection:');
          console.log('- Looking for ticket_id:', selectedTierData.ticket_id);
          console.log('- Available tickets:', tickets);
          
          const ticket = tickets.find((t) => t.ticket_id === selectedTierData.ticket_id);
          console.log('- Found ticket:', ticket);
          
          if (ticket) {
            console.log('- Ticket details:', {
              id: ticket.ticket_id,
              name: ticket.ticket_name,
              remaining: ticket.remaining,
              category_id: ticket.category_id
            });
            
            if (parseInt(ticket.remaining) <= 0) {
              console.log('- Ticket is sold out, looking for next available ticket');
              const nextAvailableTicket = tickets.find(t => parseInt(t.remaining) > 0);
              console.log('- Next available ticket:', nextAvailableTicket);
              
              if (nextAvailableTicket) {
                // Fetch category information for the next available ticket
                try {
                  const categoryRes = await api.get("/categories", {
                    params: { 
                      categoryId: nextAvailableTicket.category_id
                    }
                  });
                  
                  console.log('Category Response:', categoryRes.data);
                  
                  if (categoryRes.data && categoryRes.data.length > 0) {
                    const matchedCategory = categoryRes.data.find(cat => cat.category_id === nextAvailableTicket.category_id);
                    if (matchedCategory) {
                      console.log('Found Category:', matchedCategory);
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
                      
                      console.log('Ticket with Category:', ticketWithCategory);
                      setSelectedTicket(ticketWithCategory);
                      setTicketQuantity(numberOfAdults);
                    } else {
                      console.warn('No matching category found for ticket:', nextAvailableTicket);
                      setSelectedTicket(nextAvailableTicket);
                      setTicketQuantity(numberOfAdults);
                    }
                  } else {
                    console.warn('No category found for ticket:', nextAvailableTicket);
                    setSelectedTicket(nextAvailableTicket);
                    setTicketQuantity(numberOfAdults);
                  }
                } catch (error) {
                  console.error("Failed to fetch category data:", error);
                  toast.error("Failed to load category information");
                }
              } else {
                console.log('- No available tickets found');
                toast.error("No available tickets found");
              }
            } else {
              // Fetch category information for the selected ticket
              try {
                const categoryRes = await api.get("/categories", {
                  params: { 
                    categoryId: ticket.category_id
                  }
                });
                
                console.log('Category Response:', categoryRes.data);
                
                if (categoryRes.data && categoryRes.data.length > 0) {
                  const matchedCategory = categoryRes.data.find(cat => cat.category_id === ticket.category_id);
                  if (matchedCategory) {
                    console.log('Found Category:', matchedCategory);
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
                    
                    console.log('Ticket with Category:', ticketWithCategory);
                    setSelectedTicket(ticketWithCategory);
                    setTicketQuantity(numberOfAdults);
                  } else {
                    console.warn('No matching category found for ticket:', ticket);
                    setSelectedTicket(ticket);
                    setTicketQuantity(numberOfAdults);
                  }
                } else {
                  console.warn('No category found for ticket:', ticket);
                  setSelectedTicket(ticket);
                  setTicketQuantity(numberOfAdults);
                }
              } catch (error) {
                console.error("Failed to fetch category data:", error);
                toast.error("Failed to load category information");
              }
            }
          } else {
            console.log('- No ticket found with ID:', selectedTierData.ticket_id);
            console.log('- Available ticket IDs:', tickets.map(t => t.ticket_id));
          }
        } else {
          console.log('No ticket_id in tier data');
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
                  params: { 
                    hotelId: hotel.hotel_id,
                    packageId: selectedPackage?.package_id 
                  },
                }),
                api.get("/airport-transfers", {
                  params: { 
                    hotelId: hotel.hotel_id,
                    packageId: selectedPackage?.package_id 
                  },
                }),
              ]);

              setRooms(roomsRes.data);
              
              // Filter circuit transfers by package ID and hotel ID
              const filteredCircuitTransfers = circuitRes.data.filter(transfer => {
                const packageIds = transfer.package_id.split(',').map(id => id.trim());
                return packageIds.includes(selectedPackage?.package_id) && 
                       transfer.hotel_id === hotel.hotel_id;
              });
              
              // Filter airport transfers by package ID and hotel ID
              const filteredAirportTransfers = airportRes.data.filter(transfer => {
                const packageIds = transfer.package_id.split(',').map(id => id.trim());
                return packageIds.includes(selectedPackage?.package_id) && 
                       transfer.hotel_id === hotel.hotel_id;
              });
              
              setCircuitTransfers(filteredCircuitTransfers);
              setAirportTransfers(filteredAirportTransfers);

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

              // Set circuit transfer if specified in tier
              if (selectedTierData.circuit_transfer_id) {
                const circuitTransfer = filteredCircuitTransfers.find(
                  (t) => t.circuit_transfer_id === selectedTierData.circuit_transfer_id
                );
                if (circuitTransfer) {
                  setSelectedCircuitTransfer(circuitTransfer);
                  setCircuitTransferQuantity(ticketQuantity);
                }
              }

              // Set airport transfer if specified in tier
              if (selectedTierData.airport_transfer_id) {
                const airportTransfer = filteredAirportTransfers.find(
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

        // Get transfers
        const [circuitRes, airportRes] = await Promise.all([
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
    if (foundFlight) {
      setSelectedFlight(foundFlight);
      setFlightQuantity(numberOfAdults);
    }
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
    if (foundPass) {
      setSelectedLoungePass(foundPass);
      setLoungePassQuantity(1);
    }
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

  return (
    <div className="p-4 bg-card rounded-md border shadow-sm w-full mx-auto h-full flex flex-col gap-4">
      {/* Role Switcher for Admin */}
      {isAdmin && (
        <div className="flex items-center justify-end space-x-2 p-2 bg-muted rounded-md">
          <Label htmlFor="pricing-mode" className="text-sm font-medium">
            {isExternalView ? "External B2B View" : "Internal Sales View"}
          </Label>
          <Switch
            id="pricing-mode"
            checked={isExternalView}
            onCheckedChange={setIsExternalView}
          />
        </div>
      )}

      <div className="flex flex-row gap-4">
        {/* Left side - Selection panels */}
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
                      {hotels
                        .filter(hotel => rooms.some(room => 
                          room.hotel_id === hotel.hotel_id && 
                          room.package_id.split(',').map(id => id.trim()).includes(selectedPackage.package_id)
                        ))
                        .map((hotel) => (
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
                      <div className="flex items-center gap-2">
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                        {dateRange?.from && dateRange?.to && (
                          <span className="text-sm text-muted-foreground">
                            ({differenceInDays(dateRange.to, dateRange.from)} {differenceInDays(dateRange.to, dateRange.from) === 1 ? 'night' : 'nights'})
                          </span>
                        )}
                      </div>
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
                <div className="text-xs space-y-1 pt-1">
                  <div className="flex justify-between items-center">
                    <p className="text-foreground">Quantity:</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-fit text-xs bg-primary text-primary-foreground">
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
                          {selectedTicket.category && (
                            <div className="space-y-4">
                              <Carousel className="w-full">
                                <CarouselContent>
                                  {selectedTicket.category.ticket_image_1 && (
                                    <CarouselItem>
                                      <div className="p-1">
                                        <img
                                          src={selectedTicket.category.ticket_image_1}
                                          alt="Ticket View 1"
                                          className="w-full h-auto rounded-lg"
                                        />
                                      </div>
                                    </CarouselItem>
                                  )}
                                  {selectedTicket.category.ticket_image_2 && (
                                    <CarouselItem>
                                      <div className="p-1">
                                        <img
                                          src={selectedTicket.category.ticket_image_2}
                                          alt="Ticket View 2"
                                          className="w-full h-auto rounded-lg"
                                        />
                                      </div>
                                    </CarouselItem>
                                  )}
                                </CarouselContent>
                                {(selectedTicket.category.ticket_image_1 || selectedTicket.category.ticket_image_2) && (
                                  <>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                  </>
                                )}
                              </Carousel>
                            </div>
                          )}

                          {/* Info Column */}
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
                        </div>
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
          {selectedEvent && selectedPackage && (
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
                          From: {selectedFlight.from_location}
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
                                            {currencySymbols[flight.currency || selectedCurrency]}
                                            {flight.price * numberOfAdults}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {currencySymbols[flight.currency || selectedCurrency]}
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
                  <div className="flex items-center justify-between">
                    <p className="text-foreground">Price per person:</p>
                    <p className="text-foreground">
                      {currencySymbols[selectedFlight.currency || selectedCurrency]}
                      {selectedFlight.price}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground">Total Price:</p>
                    <p className="text-foreground">
                      {currencySymbols[selectedFlight.currency || selectedCurrency]}
                      {selectedFlight.price * numberOfAdults}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lounge Pass */}
          {selectedEvent && selectedPackage && (
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
                    {loungePasses
                      .filter(lp => lp.event_id === selectedEvent.event_id)
                      .map((lp) => (
                        <SelectItem key={lp.lounge_pass_id} value={lp.lounge_pass_id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{lp.variant}</span>
                            <span className="text-xs text-muted-foreground">
                              {currencySymbols[lp.currency || selectedCurrency]}{lp.price}
                            </span>
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedLoungePass && (
                <div className="text-xs space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground">Quantity:</p>
                    <QuantitySelector
                      value={loungePassQuantity}
                      onChange={setLoungePassQuantity}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground">Price per pass:</p>
                    <p className="text-foreground">
                      {currencySymbols[selectedLoungePass.currency || selectedCurrency]}
                      {selectedLoungePass.price}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground">Total:</p>
                    <p className="text-foreground">
                      {currencySymbols[selectedLoungePass.currency || selectedCurrency]}
                      {selectedLoungePass.price * loungePassQuantity}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Total price and actions */}
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
                  {(isAdmin || effectiveRole === "External B2B") && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isExternalView || effectiveRole === "External B2B" ? "10% Commission payable" : ""}
                    </p>
                  )}
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

              {/* More Info Section for External B2B */}
              {effectiveRole === "External B2B" && (selectedEvent || selectedPackage) && (
                <div className="mt-4 p-4 border rounded-md bg-card space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Info className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">More Information</h3>
                  </div>
                  
                  {selectedEvent && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-medium text-foreground">Event Consultant</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs pl-6">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Name</p>
                          <p className="text-foreground font-medium">{selectedEvent.consultant_name || 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Phone</p>
                          <p className="text-foreground">
                            {selectedEvent.consultant_phone ? (
                              <a 
                                href={`tel:${selectedEvent.consultant_phone}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {selectedEvent.consultant_phone}
                              </a>
                            ) : (
                              'Not specified'
                            )}
                          </p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-muted-foreground">Email</p>
                          <p className="text-foreground">
                            {selectedEvent.consultant_email ? (
                              <a 
                                href={`mailto:${selectedEvent.consultant_email}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {selectedEvent.consultant_email}
                              </a>
                            ) : (
                              'Not specified'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPackage && selectedPackage.url && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-medium text-foreground">Package Details</h4>
                      </div>
                      <div className="text-xs pl-6">
                        <a 
                          href={selectedPackage.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Package Details
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                {effectiveRole === "External B2B" ? (
                  <Button 
                    className="w-full"
                    onClick={() => setShowRequestDialog(true)}
                  >
                    Request Booking
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => setShowBookingForm(true)}
                  >
                    Create Booking
                  </Button>
                )}
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
      </div>

      {/* Modals */}
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

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Booking</DialogTitle>
            <DialogDescription>
              Fill out the form below to request a booking. Our sales team will process your request.
            </DialogDescription>
          </DialogHeader>
          <div className="pr-4">
            <RequestBooking
              numberOfAdults={numberOfAdults}
              totalPrice={totalPrice}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

CombinedPricing.propTypes = {
  numberOfAdults: PropTypes.number,
  setNumberOfAdults: PropTypes.func,
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
  userRole: PropTypes.string.isRequired,
};

export { CombinedPricing }; 