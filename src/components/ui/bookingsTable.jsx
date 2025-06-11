import { useEffect, useState } from "react";
import api, { generateItinerary, getItinerary, updateItinerary } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Search,
  Filter,
  Pencil,
  Eye,
  Loader2,
  ChevronDown,
  RefreshCw,
  FileText,
  ExternalLink,
  User,
  UserCircle,
  Users,
  Ticket,
  Hotel,
  Car,
  CreditCard,
  Package,
  Trophy,
  UserPlus,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItineraryGenerator } from './ItineraryGenerator';
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal } from "lucide-react";
import ItineraryPDF from "./ItineraryPDF";
import { jwtDecode } from "jwt-decode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { differenceInCalendarDays } from "date-fns";

// Role-based column configurations
const roleBasedColumns = {
  "Admin": [
    "booking_ref",
    "status",
    "event_name",
    "package_type",
    "booker_name",
    "booking_date",
    "total_cost",
    "total_sold_gbp",
    "p&l",
    "payment_status",
    "actions"
  ],
  "Internal Sales": [
    "booking_ref",
    "status",
    "event_name",
    "package_type",
    "booker_name",
    "booking_date",
    "total_sold_gbp",
    "payment_status",
    "actions"
  ],
  "Operations": [
    "booking_ref",
    "status",
    "event_name",
    "package_type",
    "booker_name",
    "booking_date",
    "total_cost",
    "payment_status",
    "actions"
  ]
};

// Role-based editable fields
const roleBasedEditableFields = {
  "Admin": [
    "status",
    "package_type",
    "booker_name",
    "booker_email",
    "booker_phone",
    "lead_traveller_name",
    "lead_traveller_email",
    "lead_traveller_phone",
    "guest_traveller_names",
    "adults",
    "total_cost",
    "total_sold_gbp",
    "payment_status",
    "tickets",
    "hotel_rooms",
    "circuit_transfers",
    "airport_transfers",
    "lounge_passes"
  ],
  "Internal Sales": [
    "status",
    "package_type",
    "booker_name",
    "booker_email",
    "booker_phone",
    "lead_traveller_name",
    "lead_traveller_email",
    "lead_traveller_phone",
    "guest_traveller_names",
    "adults",
    "total_sold_gbp",
    "payment_status",
    "tickets",
    "hotel_rooms",
    "circuit_transfers",
    "airport_transfers",
    "lounge_passes"
  ],
  "Operations": [
    "status",
    "package_type",
    "booker_name",
    "booker_email",
    "booker_phone",
    "lead_traveller_name",
    "lead_traveller_email",
    "lead_traveller_phone",
    "guest_traveller_names",
    "adults",
    "total_cost",
    "payment_status"
  ]
};

function BookingsTable() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [viewingBooking, setViewingBooking] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const itemsPerPage = 15;
  const [tickets, setTickets] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [airportTransfers, setAirportTransfers] = useState([]);
  const [loungePasses, setLoungePasses] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [formData, setFormData] = useState({
    hotel_id: null,
    room_id: null,
    room_quantity: 0,
    check_in_date: null,
    check_out_date: null,
    nights: 0,
    event_id: null,
    ticket_id: null,
    ticket_quantity: 0,
    circuit_transfer_id: null,
    circuit_transfer_quantity: 0,
    airport_transfer_id: null,
    airport_transfer_quantity: 0
  });

  // Add state for payment history
  const [paymentHistory, setPaymentHistory] = useState({
    originalTotal: 0,
    paidAmounts: [],
    dueAmounts: []
  });

  // Add state for calculated totals
  const [calculatedTotals, setCalculatedTotals] = useState({
    totalCost: 0,
    totalSold: 0,
    paymentAmounts: [0, 0, 0],
    amountDue: 0
  });

  // Add state for pricing
  const [exchangeRate, setExchangeRate] = useState(1);
  const [spread, setSpread] = useState(0);
  const [b2bCommission, setB2bCommission] = useState(0);

  // Add currency symbols
  const currencySymbols = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
  };

  // Add available currencies
  const availableCurrencies = ["GBP", "USD", "EUR", "AUD", "CAD"];

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

  // Fetch B2B commission for external users
  useEffect(() => {
    const fetchB2bCommission = async () => {
      if (userRole === "External B2B") {
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
  }, [userRole]);

  // Get user role from token on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
        setSelectedRole(decoded.role);
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  // Get visible columns based on role
  const getVisibleColumns = () => {
    return roleBasedColumns[selectedRole] || roleBasedColumns["Internal Sales"];
  };

  // Get editable fields based on role
  const getEditableFields = () => {
    return roleBasedEditableFields[selectedRole] || roleBasedEditableFields["Internal Sales"];
  };

  // Add sorting state
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Define sortable columns
  const sortColumns = [
    { value: "booking_ref", label: "Booking Reference" },
    { value: "status", label: "Status" },
    { value: "event_name", label: "Event" },
    { value: "package_type", label: "Package" },
    { value: "booker_name", label: "Booker" },
    { value: "booking_date", label: "Booking Date" },
    { value: "total_cost", label: "Total Cost" },
    { value: "total_sold_gbp", label: "Total Sold (GBP)" },
    { value: "p&l", label: "P&L" },
    { value: "payment_status", label: "Payment Status" }
  ];

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    event: "all",
    package: "all",
    bookingType: "all",
    consultant: "all",
    bookingDateRange: { from: null, to: null },
  });

  const getCurrencySymbol = (currencyCode) => {
    return currencySymbols[currencyCode] || currencyCode;
  };

  const bookingFieldMappings = {
    // Primary key
    booking_id: "booking_id",

    // Status and reference fields
    status: "status",
    booking_ref: "booking_ref",
    booking_type: "booking_type",
    consultant: "consultant",
    acquisition: "acquisition",
    event_id: "event_id",
    sport: "Sport",
    event_name: "Event Name",
    package_id: "package_id",
    package_type: "Package Type",
    atol_abtot: "atol_abtot",
    booking_date: "booking_date",

    // Booker information
    booker_name: "booker_name",
    booker_email: "booker_email",
    booker_phone: "booker_phone",
    booker_address: "booker_address",

    // Traveller information
    lead_traveller_name: "lead_traveller_name",
    lead_traveller_email: "lead_traveller_email",
    lead_traveller_phone: "lead_traveller_phone",
    guest_traveller_names: "guest_traveller_names",
    adults: "adults",

    // Ticket information
    ticket_id: "ticket_id",
    ticket_name: "Ticket Name",
    ticket_quantity: "ticket_quantity",
    ticket_cost: "Ticket Cost",
    ticket_price: "ticket_price",

    // Hotel information
    hotel_id: "hotel_id",
    hotel_name: "Hotel Name",
    room_id: "room_id",
    room_category: "Room Category",
    room_type: "Room Type",
    check_in_date: "check_in_date",
    check_out_date: "check_out_date",
    nights: "nights",
    extra_nights: "extra_nights",
    room_quantity: "room_quantity",
    room_cost: "Room Cost",
    room_price: "room_price",

    // Transfer information
    airport_transfer_id: "airport_transfer_id",
    airport_transfer_type: "Airport Transfer Type",
    airport_transfer_quantity: "airport_transfer_quantity",
    airport_transfer_cost: "Airport Transfer Cost",
    airport_transfer_price: "airport_transfer_price",
    circuit_transfer_id: "circuit_transfer_id",
    circuit_transfer_type: "Circuit Transfer Type",
    circuit_transfer_quantity: "circuit_transfer_quantity",
    circuit_transfer_cost: "Circuit Transfer Cost",
    circuit_transfer_price: "circuit_transfer_price",

    // Flight information
    flight_id: "flight_id",
    flight_outbound: "Flight Outbound",
    flight_inbound: "Flight Inbound",
    flight_class: "Flight Class",
    flight_carrier: "Flight Carrier",
    flight_source: "Flight Source",
    flight_booking_reference: "flight_booking_reference",
    ticketing_deadline: "ticketing_deadline",
    flight_status: "flight_status",
    flight_quantity: "flight_quantity",
    flight_cost: "Flight Cost",
    flight_price: "flight_price",

    // Lounge pass information
    lounge_pass_id: "lounge_pass_id",
    lounge_pass_variant: "Lounge Pass Variant",
    lounge_pass_quantity: "lounge_pass_quantity",
    lounge_pass_cost: "Lounge Pass Cost",
    lounge_pass_price: "lounge_pass_price",

    // Payment information
    payment_currency: "payment_currency",
    payment_1: "payment_1",
    payment_1_date: "payment_1_date",
    payment_1_status: "payment_1_status",
    payment_2: "payment_2",
    payment_2_date: "payment_2_date",
    payment_2_status: "payment_2_status",
    payment_3: "payment_3",
    payment_3_date: "payment_3_date",
    payment_3_status: "payment_3_status",
    amount_due: "Amount Due",
    payment_status: "Payment Status",
    total_cost: "Total Cost",
    total_sold_for_local: "Total Sold For Local",
    total_sold_gbp: "Total Sold GBP",
    pnl: "P&L",
  };

  const [selectedBookings, setSelectedBookings] = useState([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bookingsWithItineraries, setBookingsWithItineraries] = useState(new Set());
  const [viewingItinerary, setViewingItinerary] = useState(null);
  const [isItineraryDialogOpen, setIsItineraryDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [tiers, setTiers] = useState([]);

  // Add this function to handle bulk itinerary generation
  const handleBulkGenerateItineraries = async () => {
    if (selectedBookings.length === 0) return;
    
    setIsBulkGenerating(true);
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Show initial toast
    toast.info(`Starting to process ${selectedBookings.length} itineraries...`);

    for (const booking of selectedBookings) {
      try {
        console.log(`Processing itinerary for booking ${booking.booking_ref}...`);
        
        // First check if an itinerary exists
        const existingItinerary = await getItinerary(booking.booking_id);
        
        if (existingItinerary) {
          // If itinerary exists, update it
          console.log(`Updating existing itinerary for ${booking.booking_ref}...`);
          const generatedContent = await generateItinerary(booking);
          await updateItinerary(booking.booking_id, generatedContent);
          toast.success(`Updated itinerary for ${booking.booking_ref}`);
        } else {
          // If no itinerary exists, create new one
          console.log(`Creating new itinerary for ${booking.booking_ref}...`);
          await generateItinerary(booking);
          toast.success(`Generated new itinerary for ${booking.booking_ref}`);
        }
        
        results.success++;
      } catch (error) {
        console.error(`Failed to process itinerary for ${booking.booking_ref}:`, error);
        results.failed++;
        results.errors.push({
          bookingRef: booking.booking_ref,
          error: error.message
        });
        // Show error toast for this specific booking
        toast.error(`Failed to process itinerary for ${booking.booking_ref}: ${error.message}`);
      }
    }

    setIsBulkGenerating(false);
    
    // Show final summary toast
    if (results.success > 0) {
      toast.success(`Successfully processed ${results.success} itineraries`);
    }
    if (results.failed > 0) {
      toast.error(`Failed to process ${results.failed} itineraries`);
      console.error('Failed itineraries:', results.errors);
    }

    // Clear selection after completion
    setSelectedBookings([]);
  };

  // Add this function to handle selection
  const handleSelectBooking = (booking) => {
    setSelectedBookings(prev => {
      const isSelected = prev.some(b => b.booking_id === booking.booking_id);
      if (isSelected) {
        return prev.filter(b => b.booking_id !== booking.booking_id);
      } else {
        return [...prev, booking];
      }
    });
  };

  // Add this function to handle select all
  const handleSelectAll = () => {
    if (selectedBookings.length === currentItems.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings([...currentItems]);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("bookingFile");
      setBookings(response.data);
      // Check itineraries after loading bookings
      await checkBookingsItineraries(response.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    return [
      ...new Set(bookings.map((booking) => booking[field]).filter(Boolean)),
    ];
  };

  // Update the filterBookings function to include sorting
  const filterBookings = (items) => {
    let filtered = items.filter((item) => {
      const searchMatch =
        filters.search === "" ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      const statusMatch =
        filters.status === "all" || item.status === filters.status;
      const eventMatch =
        filters.event === "all" || item.event_name === filters.event;
      const packageMatch =
        filters.package === "all" || item.package_type === filters.package;
      const bookingTypeMatch =
        filters.bookingType === "all" ||
        item.booking_type === filters.bookingType;
      const consultantMatch =
        filters.consultant === "all" || item.consultant === filters.consultant;
      // Date range filter using DatePickerWithRange
      let dateMatch = true;
      if (filters.bookingDateRange.from) {
        dateMatch =
          dateMatch &&
          new Date(item.booking_date) >=
            new Date(filters.bookingDateRange.from);
      }
      if (filters.bookingDateRange.to) {
        dateMatch =
          dateMatch &&
          new Date(item.booking_date) <= new Date(filters.bookingDateRange.to);
      }

      return (
        searchMatch &&
        statusMatch &&
        eventMatch &&
        packageMatch &&
        bookingTypeMatch &&
        consultantMatch &&
        dateMatch
      );
    });

    // Apply sorting only if a sort column is selected
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // Handle numeric values
        if (["total_cost", "total_sold_gbp", "p&l"].includes(sortColumn)) {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        // Handle dates
        if (sortColumn === "booking_date") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        // Handle strings
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId) => {
    setBookingToDelete(bookingId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`bookingFile/booking_id/${bookingToDelete}`);
      setBookings((prevBookings) =>
        prevBookings.filter((booking) => booking.booking_id !== bookingToDelete)
      );
      setSuccessMessage("Booking deleted successfully!");
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to delete booking:", error);
      toast.error("Failed to delete booking. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setBookingToDelete(null);
      setIsDeleting(false);
    }
  };

  // Apply filters and calculate pagination
  const filteredBookings = filterBookings(bookings).reverse();
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredBookings.slice(startIndex, endIndex);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    try {
      // Handle DD-MMM-YYYY format (e.g., "06-May-2025")
      if (dateStr.includes("-")) {
        const [day, month, year] = dateStr.split("-");
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
        return new Date(year, monthIndex, day);
      }

      // Handle YYYY-MM-DD format
      return new Date(dateStr);
    } catch (error) {
      console.error("Error parsing date:", dateStr, error);
      return null;
    }
  };

  const formatDateForBackend = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateStr, error);
      return dateStr; // Return original if formatting fails
    }
  };

  // Add function to fetch package components
  const fetchPackageComponents = async (packageId) => {
    if (!packageId) return;

    try {
      setLoadingComponents(true);

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
        loungePassesRes,
        flightsRes
      ] = await Promise.all([
        api.get("/tickets", { params: { packageId } }),
        api.get("/circuit-transfers", { params: { packageId } }),
        api.get("/airport-transfers", { params: { packageId } }),
        api.get("/lounge-passes", { params: { packageId } }),
        api.get("/flights", { params: { packageId } })
      ]);

      setRooms(roomsRes.data);
      setHotels(hotelsRes.data);
      setTickets(ticketsRes.data);
      setCircuitTransfers(circuitTransfersRes.data);
      setAirportTransfers(airportTransfersRes.data);
      setLoungePasses(loungePassesRes.data);
      setFlights(flightsRes.data);

      // If we have a selected hotel, filter transfers for that hotel
      if (editingBooking?.hotel_id) {
        const filteredCircuitTransfers = circuitTransfersRes.data.filter(transfer => {
          const packageIds = transfer.package_id.split(',').map(id => id.trim());
          return packageIds.includes(packageId) && 
                 transfer.hotel_id === editingBooking.hotel_id;
        });
        
        const filteredAirportTransfers = airportTransfersRes.data.filter(transfer => {
          const packageIds = transfer.package_id.split(',').map(id => id.trim());
          return packageIds.includes(packageId) && 
                 transfer.hotel_id === editingBooking.hotel_id;
        });
        
        setCircuitTransfers(filteredCircuitTransfers);
        setAirportTransfers(filteredAirportTransfers);
      }

    } catch (error) {
      console.error("Failed to fetch package components:", error);
      toast.error("Failed to load package components");
    } finally {
      setLoadingComponents(false);
    }
  };

  // Improve the calculateTotals function
  const calculateTotals = (formData) => {
    let total = 0;
    const currency = formData.currency || "GBP";
    const currencySymbol = getCurrencySymbol(currency);

    // Calculate room cost
    if (formData.room_id) {
      const room = rooms.find(r => r.room_id === formData.room_id);
      if (room) {
        // Calculate nights as difference between check-in and check-out
        let nights = formData.nights;
        let defaultNights = room.nights;
        let extraNights = Math.max(0, nights - defaultNights);
        // Base price for default nights
        const basePrice = Number(room.price) * formData.room_quantity;
        // Extra nights price if applicable
        const extraNightsPrice = extraNights > 0 
          ? (Number(room.extra_night_price) * extraNights * formData.room_quantity)
          : 0;
        total += basePrice + extraNightsPrice;
      }
    }

    // Calculate ticket cost
    if (formData.ticket_id) {
      const ticket = tickets.find(t => t.ticket_id === formData.ticket_id);
      if (ticket) {
        total += Number(ticket.price) * formData.ticket_quantity;
      }
    }

    // Calculate circuit transfer cost
    if (formData.circuit_transfer_id) {
      const transfer = circuitTransfers.find(t => t.circuit_transfer_id === formData.circuit_transfer_id);
      if (transfer) {
        total += Number(transfer.price) * formData.circuit_transfer_quantity;
      }
    }

    // Calculate airport transfer cost
    if (formData.airport_transfer_id) {
      const transfer = airportTransfers.find(t => t.airport_transfer_id === formData.airport_transfer_id);
      if (transfer) {
        total += Number(transfer.price) * formData.airport_transfer_quantity;
      }
    }

    // Calculate flight cost
    if (formData.flight_id) {
      const flight = flights.find(f => f.flight_id === formData.flight_id);
      if (flight) {
        total += Number(flight.price) * formData.flight_quantity;
      }
    }

    // Calculate lounge pass cost
    if (formData.lounge_pass_id) {
      const pass = loungePasses.find(p => p.lounge_pass_id === formData.lounge_pass_id);
      if (pass) {
        total += Number(pass.price) * formData.lounge_pass_quantity;
      }
    }

    // ROUNDING LOGIC (match CombinedPricing)
    const rounded = Math.ceil(total / 100) * 100 - 2;
    // Optionally, apply B2B commission and exchange rate here if needed
    // For now, just use rounded
    return {
      total: rounded,
      currency,
      currencySymbol,
      formattedTotal: `${currencySymbol}${rounded.toFixed(2)}`
    };
  };

  // Add function to handle payment status changes
  const handlePaymentStatusChange = (num, newStatus) => {
    const formData = new FormData();
    // Get all current form values
    const form = document.querySelector('form');
    if (form) {
      new FormData(form).forEach((value, key) => {
        formData.append(key, value);
      });
    }
    
    // Update payment status
    formData.set(`payment_${num}_status`, newStatus);
    
    // Recalculate totals
    const newTotals = calculateTotals(formData);
    setCalculatedTotals(newTotals);
  };

  // Add function to handle component changes
  const handleComponentChange = (value, name) => {
    if (name === "hotel_id") {
      if (value === "none") {
        setFormData(prev => ({
          ...prev,
          hotel_id: null,
          room_id: null,
          room_quantity: 0,
          check_in_date: null,
          check_out_date: null,
          nights: 0
        }));
        setDateRange({ from: null, to: null });
        return;
      }

      // Find hotel from our existing data
      const hotel = hotels.find(h => h.hotel_id === value);
      if (hotel) {
        setFormData(prev => ({
          ...prev,
          hotel_id: hotel.hotel_id,
          room_id: null,
          room_quantity: 0,
          check_in_date: null,
          check_out_date: null,
          nights: 0
        }));
        setDateRange({ from: null, to: null });

        // Filter rooms for this hotel from our existing rooms
        const hotelRooms = rooms.filter(r => r.hotel_id === hotel.hotel_id);
        setRooms(hotelRooms);
      }
    } else if (name === "room_id") {
      if (value === "none") {
        setFormData(prev => ({
          ...prev,
          room_id: null,
          room_quantity: 0,
          check_in_date: null,
          check_out_date: null,
          nights: 0
        }));
        setDateRange({ from: null, to: null });
        return;
      }

      const room = rooms.find(r => r.room_id === value);
      if (room) {
        // Convert dates from DD/MM/YYYY to Date objects
        const from = new Date(room.check_in_date.split('/').reverse().join('-'));
        const to = new Date(room.check_out_date.split('/').reverse().join('-'));
        setDateRange({ from, to });
        
        // If this is the originally booked room, keep the original nights
        // Otherwise use the room's default nights
        const nights = room.room_id === editingBooking?.room_id 
          ? editingBooking.nights  // Keep original booking nights
          : room.nights;  // Use room's default nights
        
        setFormData(prev => ({
          ...prev,
          room_id: room.room_id,
          room_quantity: room.room_id === editingBooking?.room_id ? editingBooking.room_quantity : 1,
          check_in_date: room.check_in_date,
          check_out_date: room.check_out_date,
          nights
        }));

        // Show pricing information
        const currencySymbol = getCurrencySymbol(room.currency);
        if (nights > room.nights) {
          const extraNights = nights - room.nights;
          const extraNightsCost = room.extra_night_price * extraNights;
          toast.info(
            <div className="space-y-1">
              <p>Room pricing breakdown:</p>
              <p>• Base price ({room.nights} nights): {currencySymbol}{room.price}</p>
              <p>• Extra nights ({extraNights} nights): {currencySymbol}{extraNightsCost}</p>
              <p>• Total room cost: {currencySymbol}{(room.price + extraNightsCost).toFixed(2)}</p>
            </div>
          );
        } else {
          toast.info(
            <div>
              <p>Room price: {currencySymbol}{room.price} for {room.nights} nights</p>
              <p>Extra nights available at {currencySymbol}{room.extra_night_price} per night</p>
            </div>
          );
        }
      }
    } else if (name === "ticket_id") {
      if (value === "none") {
        setFormData(prev => ({
          ...prev,
          ticket_id: null,
          ticket_quantity: 0,
          circuit_transfer_id: null,
          circuit_transfer_quantity: 0
        }));
          return;
        }

      const foundTicket = tickets.find(t => t.ticket_id === value);
      if (foundTicket) {
        // If this is the originally booked ticket, keep the original quantity
        // Otherwise use the number of adults
        const quantity = foundTicket.ticket_id === editingBooking?.ticket_id 
          ? editingBooking.ticket_quantity 
          : formData.number_of_adults;

        setFormData(prev => ({
          ...prev,
          ticket_id: foundTicket.ticket_id,
          ticket_quantity: quantity,
          circuit_transfer_id: null,
          circuit_transfer_quantity: 0
        }));

        // Show ticket info
        const currencySymbol = getCurrencySymbol(foundTicket.currency);
        toast.info(
          <div>
            <p>Ticket price: {currencySymbol}{foundTicket.price} per person</p>
            <p>Total: {currencySymbol}{(foundTicket.price * quantity).toFixed(2)}</p>
          </div>
        );
      }
    } else if (name === "ticket_quantity") {
      const quantity = parseInt(value);
      const selectedTicket = tickets.find(t => t.ticket_id === formData.ticket_id);
      
      if (selectedTicket) {
        // Allow selecting original quantity even if remaining is 0
        const maxQuantity = selectedTicket.ticket_id === editingBooking?.ticket_id
          ? Math.max(selectedTicket.remaining, editingBooking.ticket_quantity)
          : selectedTicket.remaining;

        if (quantity > maxQuantity) {
          toast.warning(`Only ${maxQuantity} tickets remaining`);
          return;
        }

        setFormData(prev => ({
          ...prev,
          ticket_quantity: quantity,
          circuit_transfer_quantity: quantity // Update circuit transfer quantity to match
        }));
      }
    } else if (name === "circuit_transfer_id") {
      if (value === "none") {
        setFormData(prev => ({
          ...prev,
          circuit_transfer_id: null,
          circuit_transfer_quantity: 0
        }));
        return;
      }

      const transfer = circuitTransfers.find(t => t.circuit_transfer_id === value);
      if (transfer) {
        // If this is the originally booked transfer, keep the original quantity
        // Otherwise use the ticket quantity
        const quantity = transfer.circuit_transfer_id === editingBooking?.circuit_transfer_id 
          ? editingBooking.circuit_transfer_quantity 
          : formData.ticket_quantity;

        setFormData(prev => ({
          ...prev,
          circuit_transfer_id: transfer.circuit_transfer_id,
          circuit_transfer_quantity: quantity
        }));

        // Show transfer info
        const currencySymbol = getCurrencySymbol(transfer.currency);
        toast.info(
          <div>
            <p>Circuit transfer price: {currencySymbol}{transfer.price} per person</p>
            <p>Total: {currencySymbol}{(transfer.price * quantity).toFixed(2)}</p>
          </div>
        );
      }
    } else if (name === "circuit_transfer_quantity") {
      const quantity = parseInt(value);
      const selectedTransfer = circuitTransfers.find(t => t.circuit_transfer_id === formData.circuit_transfer_id);
      
      if (selectedTransfer) {
        // Allow selecting original quantity even if remaining is 0
        const maxQuantity = selectedTransfer.circuit_transfer_id === editingBooking?.circuit_transfer_id
          ? Math.max(selectedTransfer.coach_capacity, editingBooking.circuit_transfer_quantity)
          : selectedTransfer.coach_capacity;

        if (quantity > maxQuantity) {
          toast.warning(`Maximum capacity is ${maxQuantity} people`);
          return;
        }

        setFormData(prev => ({
          ...prev,
          circuit_transfer_quantity: quantity
        }));
      }
    } else if (name === "airport_transfer_id") {
      if (value === "none") {
        setFormData(prev => ({
          ...prev,
          airport_transfer_id: null,
          airport_transfer_quantity: 0
        }));
        return;
      }

      const transfer = airportTransfers.find(t => t.airport_transfer_id === value);
      if (transfer) {
        // If this is the originally booked transfer, keep the original quantity
        // Otherwise use the ticket quantity
        const quantity = transfer.airport_transfer_id === editingBooking?.airport_transfer_id 
          ? editingBooking.airport_transfer_quantity 
          : formData.ticket_quantity;

        setFormData(prev => ({
          ...prev,
          airport_transfer_id: transfer.airport_transfer_id,
          airport_transfer_quantity: quantity
        }));

        // Show transfer info
        const currencySymbol = getCurrencySymbol(transfer.currency);
        toast.info(
          <div>
            <p>Airport transfer price: {currencySymbol}{transfer.price} per person</p>
            <p>Total: {currencySymbol}{(transfer.price * quantity).toFixed(2)}</p>
          </div>
        );
      }
    } else if (name === "airport_transfer_quantity") {
      const quantity = parseInt(value);
      const selectedTransfer = airportTransfers.find(t => t.airport_transfer_id === formData.airport_transfer_id);
      
      if (selectedTransfer) {
        // Allow selecting original quantity even if remaining is 0
        const maxQuantity = selectedTransfer.airport_transfer_id === editingBooking?.airport_transfer_id
          ? Math.max(selectedTransfer.max_capacity, editingBooking.airport_transfer_quantity)
          : selectedTransfer.max_capacity;

        if (quantity > maxQuantity) {
          toast.warning(`Maximum capacity is ${maxQuantity} people`);
          return;
        }

        setFormData(prev => ({
          ...prev,
          airport_transfer_quantity: quantity
        }));
      }
    }
    // ... rest of the existing handleComponentChange function ...
  };

  // Add function to fetch rooms and hotels when event is selected
  const handleEventSelect = async (eventId) => {
    if (!eventId) return;

    setLoadingComponents(true);
    try {
      // First get the package_id from the event
      const roomsRes = await api.get("/rooms", {
        params: { eventId }
      });

      // Get package_id from the first room
      const packageId = roomsRes.data[0]?.package_id;
      console.log("Package ID:", packageId);

      // Get all rooms for this package
      const packageRoomsRes = await api.get("/rooms", {
        params: { packageId }
      });

      // Get unique hotel IDs from the rooms
      const hotelIds = [...new Set(packageRoomsRes.data.map(room => room.hotel_id))];

      // Then fetch hotels that have rooms for this package
      const hotelsRes = await api.get("/hotels", {
        params: { 
          hotelIds: hotelIds.join(',')
        }
      });

      // Fetch tickets for this package
      const ticketsRes = await api.get("/tickets", {
        params: { packageId }
      });

      // Fetch circuit transfers for this package
      const circuitTransfersRes = await api.get("/circuit-transfers", {
        params: { 
          packageIds: packageId.split(',').map(id => id.trim()).join(',')
        }
      });
      console.log("Circuit Transfers Response:", circuitTransfersRes.data);

      // Fetch airport transfers for this package
      const airportTransfersRes = await api.get("/airport-transfers", {
        params: { 
          packageIds: packageId.split(',').map(id => id.trim()).join(',')
        }
      });
      console.log("Airport Transfers Response:", airportTransfersRes.data);

      setRooms(packageRoomsRes.data);
      setHotels(hotelsRes.data);
      setTickets(ticketsRes.data);
      setCircuitTransfers(circuitTransfersRes.data);
      setAirportTransfers(airportTransfersRes.data);
      setFormData(prev => ({
        ...prev,
        event_id: eventId,
        hotel_id: null,
        room_id: null,
        room_quantity: 0,
        check_in_date: null,
        check_out_date: null,
        nights: 0,
        ticket_id: null,
        ticket_quantity: 0,
        circuit_transfer_id: null,
        circuit_transfer_quantity: 0,
        airport_transfer_id: null,
        airport_transfer_quantity: 0
      }));
    } catch (error) {
      console.error("Failed to fetch event components:", error);
      toast.error("Failed to load event components. Please try again.");
    } finally {
      setLoadingComponents(false);
    }
  };

  // Add function to handle input changes
  const handleInputChange = (e) => {
    const selectedTicket = tickets.find(t => t.ticket_id === editingBooking?.ticket_id);
    const value = parseInt(e.target.value);
    if (selectedTicket && value > selectedTicket.remaining) {
      e.target.value = selectedTicket.remaining;
      toast.warning(`Only ${selectedTicket.remaining} tickets remaining`);
    }
    handleComponentChange(e.target.value, e.target.name);
  };

  // Modify handleEditBooking to initialize payment history
  const handleEditBooking = async (booking) => {
    setEditingBooking(booking);
    setIsEditDialogOpen(true);
    setLoadingComponents(true);

    try {
      const eventId = booking.event_id;
      const packageId = booking.package_id;

      // Get all rooms for this package
      const roomsRes = await api.get("/rooms", {
        params: { packageId }
      });

      // Get unique hotels from the rooms data
      const uniqueHotels = roomsRes.data.reduce((acc, room) => {
        if (!acc.find(h => h.hotel_id === room.hotel_id)) {
          acc.push({
            hotel_id: room.hotel_id,
            hotel_name: room.hotel_name
          });
        }
        return acc;
      }, []);

      // Fetch tickets for this package
      const ticketsRes = await api.get("/tickets", {
        params: { packageId }
      });

      // Fetch circuit transfers for this package
      const circuitTransfersRes = await api.get("/circuit-transfers", {
        params: { packageId }
      });

      // Fetch airport transfers for this package
      const airportTransfersRes = await api.get("/airport-transfers", {
        params: { packageId }
      });

      setRooms(roomsRes.data);
      setHotels(uniqueHotels);
      setTickets(ticketsRes.data);
      setCircuitTransfers(circuitTransfersRes.data);
      setAirportTransfers(airportTransfersRes.data);

      // Convert dates from DD/MM/YYYY to Date objects
      const from = new Date(booking.check_in_date.split('/').reverse().join('-'));
      const to = new Date(booking.check_out_date.split('/').reverse().join('-'));
      setDateRange({ from, to });

      // Set initial form data with the original booking values
      setFormData({
        event_id: eventId,
        hotel_id: booking.hotel_id,
        room_id: booking.room_id,
        room_quantity: booking.room_quantity,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        nights: booking.nights,
        ticket_id: booking.ticket_id,
        ticket_quantity: booking.ticket_quantity,
        circuit_transfer_id: booking.circuit_transfer_id,
        circuit_transfer_quantity: booking.circuit_transfer_quantity,
        airport_transfer_id: booking.airport_transfer_id,
        airport_transfer_quantity: booking.airport_transfer_quantity
      });
    } catch (error) {
      console.error("Failed to fetch booking components:", error);
      toast.error("Failed to load booking components. Please try again.");
    } finally {
      setLoadingComponents(false);
    }
  };

  // Modify handleSubmit to handle the new data structure
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target);
      const updatedData = {
        booking_id: editingBooking.booking_id,
        status: formData.get("status"),
        package_type: formData.get("package_type"),
        booker_name: formData.get("booker_name"),
        booker_email: formData.get("booker_email"),
        booker_phone: formData.get("booker_phone"),
        lead_traveller_name: formData.get("lead_traveller_name"),
        lead_traveller_email: formData.get("lead_traveller_email"),
        lead_traveller_phone: formData.get("lead_traveller_phone"),
        guest_traveller_names: formData.get("guest_traveller_names"),
        adults: parseInt(formData.get("adults")),
        total_sold_gbp: parseFloat(formData.get("total_sold_gbp")),
        payment_status: formData.get("payment_status"),
        // Package components
        ticket_id: formData.get("ticket_id"),
        ticket_quantity: parseInt(formData.get("ticket_quantity")),
        hotel_id: formData.get("hotel_id"),
        room_id: formData.get("room_id"),
        room_quantity: parseInt(formData.get("room_quantity")),
        check_in_date: formData.get("check_in_date"),
        check_out_date: formData.get("check_out_date"),
        circuit_transfer_id: formData.get("circuit_transfer_id"),
        circuit_transfer_quantity: parseInt(formData.get("circuit_transfer_quantity")),
        airport_transfer_id: formData.get("airport_transfer_id"),
        airport_transfer_quantity: parseInt(formData.get("airport_transfer_quantity")),
        lounge_pass_id: formData.get("lounge_pass_id"),
        lounge_pass_quantity: parseInt(formData.get("lounge_pass_quantity"))
      };

      // Only include total_cost if it's editable for the current role
      if (getEditableFields().includes("total_cost")) {
        updatedData.total_cost = parseFloat(formData.get("total_cost"));
      }

      const response = await api.put(`/bookings/${editingBooking.booking_id}`, updatedData);
      
      if (response.status === 200) {
        toast.success("Booking updated successfully");
      setIsEditDialogOpen(false);
      setEditingBooking(null);
        fetchBookings(); // Refresh the bookings list
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this helper function to format dates
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const months = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const [day, month, year] = dateStr.split("-");
    return `${year}-${months[month]}-${day.padStart(2, "0")}`;
  };

  // Add this helper function to format dates for the date picker
  const formatDateForDatePicker = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Handle DD-MMM-YYYY format (e.g., "06-May-2025")
      if (dateStr.includes("-")) {
        const [day, month, year] = dateStr.split("-");
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
        return new Date(year, monthIndex, day);
      }
      return new Date(dateStr);
    } catch (error) {
      console.error("Error parsing date for date picker:", dateStr, error);
      return null;
    }
  };

  // Add this helper function to format dates for display
  const formatDateForDisplay = (date) => {
    if (!date) return "";
    return format(date, "dd-MMM-yyyy");
  };

  // Add this function to check itineraries for all bookings
  const checkBookingsItineraries = async (bookings) => {
    const itineraryStatus = new Set();
    for (const booking of bookings) {
      try {
        const itinerary = await getItinerary(booking.booking_id);
        if (itinerary) {
          itineraryStatus.add(booking.booking_id);
        }
      } catch (error) {
        console.error(`Error checking itinerary for ${booking.booking_ref}:`, error);
      }
    }
    setBookingsWithItineraries(itineraryStatus);
  };

  // Add bulk update function
  const handleBulkUpdateItineraries = async () => {
    if (selectedBookings.length === 0) return;
    
    setIsBulkGenerating(true);
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Show initial toast
    toast.info(`Starting to update ${selectedBookings.length} itineraries...`);

    for (const booking of selectedBookings) {
      try {
        console.log(`Updating itinerary for booking ${booking.booking_ref}...`);
        const generatedContent = await generateItinerary(booking);
        await updateItinerary(booking.booking_id, generatedContent);
        results.success++;
        toast.success(`Updated itinerary for ${booking.booking_ref}`);
      } catch (error) {
        console.error(`Failed to update itinerary for ${booking.booking_ref}:`, error);
        results.failed++;
        results.errors.push({
          bookingRef: booking.booking_ref,
          error: error.message
        });
        toast.error(`Failed to update itinerary for ${booking.booking_ref}: ${error.message}`);
      }
    }

    setIsBulkGenerating(false);
    
    if (results.success > 0) {
      toast.success(`Successfully updated ${results.success} itineraries`);
    }
    if (results.failed > 0) {
      toast.error(`Failed to update ${results.failed} itineraries`);
      console.error('Failed updates:', results.errors);
    }

    setSelectedBookings([]);
  };

  // Add this function to handle viewing an itinerary
  const handleViewItinerary = async (booking) => {
    setViewingItinerary(booking);
    setIsItineraryDialogOpen(true);
  };

  const handleViewBooking = (booking) => {
    setViewingBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleSort = (column) => {
    setSortColumn(column);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const renderCell = (booking, column) => {
    switch (column) {
      case "status":
        return <Badge variant="secondary">{booking.status}</Badge>;
      case "payment_status":
        return (
          <Badge
            className={`${
              booking.payment_status === "Paid"
                ? "bg-success text-primary-foreground"
                : booking.payment_status === "Cancelled"
                ? "bg-secondary text-secondary-foreground"
                : "bg-destructive text-primary-foreground"
            }`}
          >
            {booking.payment_status}
          </Badge>
        );
      case "total_cost":
      case "total_sold_gbp":
      case "p&l":
        return `£ ${booking[column].toLocaleString()}`;
      case "actions":
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewBooking(booking)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewItinerary(booking)}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditBooking(booking)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteBooking(booking.booking_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return booking[column];
    }
  };

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      const nights = differenceInCalendarDays(dateRange.to, dateRange.from);
      setFormData(prev => ({
        ...prev,
        check_in_date: format(dateRange.from, 'dd/MM/yyyy'),
        check_out_date: format(dateRange.to, 'dd/MM/yyyy'),
        nights
      }));
    }
  }, [dateRange]);


  const fetchPackages = async () => {
    if (!editingBooking?.event_id) return;
    
    try {
      setLoading(true);
      const response = await api.get("packages", {
        params: {
          event_id: editingBooking.event_id
        }
      });
      // Filter packages to only show ones for this event
      const filteredPackages = response.data.filter(pkg => pkg.event_id === editingBooking.event_id);
      setPackages(filteredPackages);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editingBooking) {
      fetchPackages();
    }
  }, [editingBooking]);

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading bookings...
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Role Switcher for Admin users */}
      {userRole === "Admin" && (
        <div className="flex justify-end mb-4">
          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Admin">Admin View</TabsTrigger>
              <TabsTrigger value="Internal Sales">Sales View</TabsTrigger>
              <TabsTrigger value="Operations">Operations View</TabsTrigger>
            </TabsList>
          </Tabs>
      </div>
      )}

      {/* Table Header with Actions */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
            <Input
              placeholder="Search bookings..."
              value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-[300px]"
            />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.status === "all"}
                onCheckedChange={() => setFilters({ ...filters, status: "all" })}
              >
                All
              </DropdownMenuCheckboxItem>
            {getUniqueValues("status").map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status === status}
                  onCheckedChange={() => setFilters({ ...filters, status })}
                >
                {status}
                </DropdownMenuCheckboxItem>
            ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Event</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.event === "all"}
                onCheckedChange={() => setFilters({ ...filters, event: "all" })}
        >
                All
              </DropdownMenuCheckboxItem>
            {getUniqueValues("event_name").map((event) => (
                <DropdownMenuCheckboxItem
                  key={event}
                  checked={filters.event === event}
                  onCheckedChange={() => setFilters({ ...filters, event })}
                >
                {event}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBookings()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Booking
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {getVisibleColumns().map((column) => (
                <TableHead key={column} className="w-auto">
                  {column === "actions" ? (
                    <div className="flex items-center justify-end">
                      <span>Actions</span>
          </div>
                  ) : (
                    <span>{column.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                  )}
              </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={getVisibleColumns().length} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={getVisibleColumns().length} className="h-24 text-center">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.booking_id}>
                  {getVisibleColumns().map((column) => (
                    <TableCell key={column} className="w-auto">
                      {column === "actions" ? (
                        <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewBooking(booking)}
                    >
                            <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                            size="sm"
                            onClick={() => handleViewItinerary(booking)}
                    >
                            <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                            size="sm"
                      onClick={() => handleEditBooking(booking)}
                    >
                            <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                            size="sm"
                      onClick={() => handleDeleteBooking(booking.booking_id)}
                    >
                            <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                      ) : (
                        renderCell(booking, column)
                      )}
                </TableCell>
            ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to{" "}
          {Math.min(endIndex, filteredBookings.length)} of{" "}
          {filteredBookings.length} items
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-success">
              Success
            </AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-start gap-4">
              <span>Booking Details - {viewingBooking?.booking_ref}</span>
              <Badge
                variant={
                  viewingBooking?.status === "Future" ? "default" : "secondary"
                }
              >
                {viewingBooking?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {viewingBooking && (
            <div className="w-full columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {/* Basic Information */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Booking Type
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.booking_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Consultant
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.consultant}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Acquisition
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.acquisition}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      ATOL/ABTOT
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.atol_abtot}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Booking Date
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.booking_date}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Sport</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.sport}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Event</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.event_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Package Type
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.package_type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booker Information */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4 ">
                <h3 className="text-sm font-semibold mb-2">Booker Information</h3>
                <div className="space-y-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.booker_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Email</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.booker_email}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.booker_phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Address
                    </span>
                    <p className="text-sm font-medium whitespace-pre-wrap">
                      {viewingBooking.booker_address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Traveller */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">Lead Traveller</h3>
                <div className="space-y-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Name</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.lead_traveller_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Email</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.lead_traveller_email}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <p className="text-sm font-medium">
                      {viewingBooking.lead_traveller_phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Adults
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.adults}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Guest Travellers
                    </span>
                    <p className="text-sm font-medium">
                      {viewingBooking.guest_traveller_names}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Information */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">
                  Ticket Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Ticket Name
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.ticket_name} x{" "}
                      {viewingBooking.ticket_quantity}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Cost
                      </span>
                      <p className="text-sm font-medium mt-1">
                        £{viewingBooking.ticket_cost?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Price
                      </span>
                      <p className="text-sm font-medium mt-1">
                        £{viewingBooking.ticket_price?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotel Information */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">
                  Hotel Information
                </h3>
                <div className="space-y-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Hotel Name
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.hotel_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Room Type
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.room_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Check-in/Check-out Dates
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.check_in_date} -{" "}
                      {viewingBooking.check_out_date}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Nights
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.nights}{" "}
                      {viewingBooking.extra_nights
                        ? `(+${viewingBooking.extra_nights})`
                        : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Room Cost
                      </span>
                      <p className="text-sm font-medium mt-1">
                        £{viewingBooking.room_cost?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Room Price
                      </span>
                      <p className="text-sm font-medium mt-1">
                        £{viewingBooking.room_price?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transfer Information */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">
                  Transfer Information
                </h3>
                <div className="space-y-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Airport Transfer Type
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.airport_transfer_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Quantity
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.airport_transfer_quantity}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Cost</span>
                    <p className="text-sm font-medium mt-1">
                      £
                      {viewingBooking.airport_transfer_cost?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Price</span>
                    <p className="text-sm font-medium mt-1">
                      £
                      {viewingBooking.airport_transfer_price?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Circuit Transfer Type
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.circuit_transfer_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Quantity
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.circuit_transfer_quantity}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Cost</span>
                    <p className="text-sm font-medium mt-1">
                      £
                      {viewingBooking.circuit_transfer_cost?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Price</span>
                    <p className="text-sm font-medium mt-1">
                      £
                      {viewingBooking.circuit_transfer_price?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Flight Information */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">
                  Flight Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Outbound
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_outbound}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Inbound
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_inbound}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Class</span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_class}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Carrier
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_carrier}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Source
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_source}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Booking Reference
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_booking_reference}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Ticketing Deadline
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.ticketing_deadline}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Status
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_status}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Quantity
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.flight_quantity}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Cost</span>
                    <p className="text-sm font-medium mt-1">
                      £{viewingBooking.flight_cost?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Price</span>
                    <p className="text-sm font-medium mt-1">
                      £{viewingBooking.flight_price?.toLocaleString() || "0"}
                    </p>
                  </div>
                  </div>
                </div>
              </div>

              {/* Lounge Pass Information */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">
                  Lounge Pass Information
                </h3>
                <div className="space-y-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Variant
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.lounge_pass_variant}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Quantity
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {viewingBooking.lounge_pass_quantity}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Cost</span>
                    <p className="text-sm font-medium mt-1">
                      £
                      {viewingBooking.lounge_pass_cost?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Price</span>
                    <p className="text-sm font-medium mt-1">
                      £
                      {viewingBooking.lounge_pass_price?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">Payment Summary</h3>
                <div className="space-y-2 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Currency
                    </span>
                    <p className="text-sm font-medium">
                      {getCurrencySymbol(viewingBooking.payment_currency)} (
                      {viewingBooking.payment_currency})
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Total Cost
                    </span>
                    <p className="text-sm font-medium">
                      £{viewingBooking.total_cost?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Total Sold (Local)
                    </span>
                    <p className="text-sm font-medium">
                      {getCurrencySymbol(viewingBooking.payment_currency)}
                      {viewingBooking.total_sold_for_local?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Total Sold (GBP)
                    </span>
                    <p className="text-sm font-medium">
                      £{viewingBooking.total_sold_gbp?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Schedule */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">Payment Schedule</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-1 pr-4 font-normal">
                          Payment
                        </TableHead>
                        <TableHead className="py-1 pr-4 font-normal">
                          Amount
                        </TableHead>
                        <TableHead className="py-1 font-normal">
                          Due Date
                        </TableHead>
                        <TableHead className="py-1 pr-4 font-normal">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[1, 2, 3].map((num) => (
                        <TableRow key={num} className="align-top">
                          <TableCell className="py-1 pr-4 font-medium">{`Payment ${num}`}</TableCell>
                          <TableCell className="py-1 pr-4">
                            {getCurrencySymbol(viewingBooking.payment_currency)}
                            {viewingBooking[
                              `payment_${num}`
                            ]?.toLocaleString() || "0"}
                          </TableCell>
                          <TableCell className="py-1">
                            {viewingBooking[`payment_${num}_date`]}
                          </TableCell>
                          <TableCell className="py-1 pr-4">
                            <Badge
                              className={`${
                                viewingBooking[`payment_${num}_status`] ===
                                "Paid"
                                  ? "bg-success text-success-foreground"
                                  : viewingBooking[`payment_${num}_status`] ===
                                    "Due"
                                  ? "bg-warning text-warning-foreground"
                                  : "bg-destructive text-destructive-foreground"
                              }`}
                            >
                              {viewingBooking[`payment_${num}_status`]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Payment Status */}
              <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold mb-2">Payment Status</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Amount Due
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {getCurrencySymbol(viewingBooking.payment_currency)}{" "}
                      {viewingBooking.amount_due?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Status
                    </span>
                    <div className="mt-0.5">
                      <Badge
                        className={`${
                          viewingBooking.payment_status === "Paid"
                            ? "bg-success text-success-foreground"
                            : viewingBooking.payment_status === "Cancelled"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-destructive text-destructive-foreground"
                        }`}
                      >
                        {viewingBooking.payment_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
 
              
                
              
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Booking - {editingBooking?.booking_ref}
            </DialogTitle>
            <DialogDescription>
              Make changes to the booking details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 h-full">
            <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-4 max-h-[calc(90vh-8rem)]">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={editingBooking?.status}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Future">Future</SelectItem>
                          <SelectItem value="Past">Past</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="booking_type">Booking Type</Label>
                      <Select name="booking_type" defaultValue={editingBooking?.booking_type}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actual">Actual</SelectItem>
                          <SelectItem value="provisional">Provisional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="acquisition">Acquisition</Label>
                      <Select name="acquisition" defaultValue={editingBooking?.acquisition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select acquisition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="repeat">Repeat</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="atol_abtot">ATOL/ABTOT</Label>
                      <Select name="atol_abtot" defaultValue={editingBooking?.atol_abtot}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="atol">ATOL</SelectItem>
                          <SelectItem value="abtot">ABTOT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="booking_date">Booking Date</Label>
                      <Input name="booking_date" type="date" defaultValue={formatDateForInput(editingBooking?.booking_date)} />
                    </div>
                  </div>
                </div>

                {/* Booker Information */}
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Booker Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="booker_name">Name</Label>
                      <Input name="booker_name" defaultValue={editingBooking?.booker_name} />
                    </div>
                    <div>
                      <Label htmlFor="booker_email">Email</Label>
                      <Input name="booker_email" type="email" defaultValue={editingBooking?.booker_email} />
                    </div>
                    <div>
                      <Label htmlFor="booker_phone">Phone</Label>
                      <Input name="booker_phone" type="tel" defaultValue={editingBooking?.booker_phone} />
                    </div>
                    <div>
                      <Label htmlFor="booker_address">Address</Label>
                      <Textarea name="booker_address" defaultValue={editingBooking?.booker_address} />
                    </div>
                  </div>
                </div>

                {/* Lead Traveller */}
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Lead Traveller
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lead_traveller_name">Name</Label>
                      <Input name="lead_traveller_name" defaultValue={editingBooking?.lead_traveller_name} />
                    </div>
                    <div>
                      <Label htmlFor="lead_traveller_email">Email</Label>
                      <Input name="lead_traveller_email" type="email" defaultValue={editingBooking?.lead_traveller_email} />
                    </div>
                    <div>
                      <Label htmlFor="lead_traveller_phone">Phone</Label>
                      <Input name="lead_traveller_phone" type="tel" defaultValue={editingBooking?.lead_traveller_phone} />
                    </div>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Guest Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guest_traveller_names">Guest Names</Label>
                      <Input name="guest_traveller_names" defaultValue={editingBooking?.guest_traveller_names} />
                    </div>
                    <div>
                      <Label htmlFor="adults">Number of Adults</Label>
                      <Input name="adults" type="number" defaultValue={editingBooking?.adults} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Event Details */}
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Event Details
                  </h3>
                  <div className="space-y-4">
                  <div>
                      <Label>{editingBooking?.sport}</Label>
                    </div>
                    <div>
                      <Label>{editingBooking?.event_name || ""} </Label>
                    </div>
                    <div>
                      <Label htmlFor="package_id">Package</Label>
                      <Select name="package_id" defaultValue={editingBooking?.package_id} onValueChange={(value) => handleComponentChange(value, 'package_id')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.map((pkg) => (
                            <SelectItem key={pkg.package_id} value={pkg.package_id}>
                              {pkg.package_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Package Components */}
                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Package Components
                  </h3>
                  <div className="space-y-6">
                    {/* Tickets */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Tickets
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ticket_id">Ticket Type</Label>
                          <Select name="ticket_id" defaultValue={editingBooking?.ticket_id} onValueChange={(value) => handleComponentChange(value, 'ticket_id')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ticket" />
                            </SelectTrigger>
                            <SelectContent>
                              {tickets.map((ticket) => {
                                const isBookedTicket = ticket.ticket_id === editingBooking?.ticket_id;
                                const displayText = isBookedTicket 
                                  ? `${ticket.ticket_name} (Originally booked: ${editingBooking?.ticket_quantity})`
                                  : `${ticket.ticket_name} (${ticket.remaining} remaining)`;
                                return (
                                  <SelectItem 
                                    key={ticket.ticket_id} 
                                    value={ticket.ticket_id}
                                    disabled={!isBookedTicket && ticket.remaining <= 0}
                                  >
                                    {displayText}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ticket_quantity">Quantity</Label>
                          <Input name="ticket_quantity" type="number" defaultValue={editingBooking?.ticket_quantity} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>

                    {/* Hotel & Room Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        Hotel & Room
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hotel_id">Hotel</Label>
                          <Select name="hotel_id" defaultValue={editingBooking?.hotel_id} onValueChange={(value) => handleComponentChange(value, 'hotel_id')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select hotel" />
                            </SelectTrigger>
                            <SelectContent>
                              {hotels.map((hotel) => (
                                <SelectItem key={hotel.hotel_id} value={hotel.hotel_id}>
                                  {hotel.hotel_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="room_id">Room Type</Label>
                          <Select name="room_id" defaultValue={editingBooking?.room_id} onValueChange={(value) => handleComponentChange(value, 'room_id')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                              {rooms.map((room) => {
                                const isBookedRoom = room.room_id === editingBooking?.room_id;
                                const displayText = isBookedRoom 
                                  ? `${room.room_category} - ${room.room_type} (Originally booked: ${editingBooking?.room_quantity})`
                                  : `${room.room_category} - ${room.room_type} (${room.remaining} remaining)`;
                                return (
                                  <SelectItem 
                                    key={room.room_id} 
                                    value={room.room_id}
                                    disabled={!isBookedRoom && room.remaining <= 0}
                                  >
                                    {displayText}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="room_quantity">Room Quantity</Label>
                          <Input name="room_quantity" type="number" defaultValue={editingBooking?.room_quantity} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label>Check-in/Check-out</Label>
                          <DatePickerWithRange
                            date={dateRange}
                            setDate={setDateRange}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nights">Nights</Label>
                          <Input name="nights" type="number" value={formData.nights} readOnly className="bg-muted" />
                        </div>
                      </div>
                    </div>

                    {/* Transfers */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Transfers
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="circuit_transfer_id">Circuit Transfer</Label>
                          <Select name="circuit_transfer_id" defaultValue={editingBooking?.circuit_transfer_id} onValueChange={(value) => handleComponentChange(value, 'circuit_transfer_id')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select circuit transfer" />
                            </SelectTrigger>
                            <SelectContent>
                              {circuitTransfers.map((transfer) => (
                                <SelectItem key={transfer.circuit_transfer_id} value={transfer.circuit_transfer_id}>
                                  {transfer.transport_type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="circuit_transfer_quantity">Circuit Transfer Quantity</Label>
                          <Input name="circuit_transfer_quantity" type="number" defaultValue={editingBooking?.circuit_transfer_quantity} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="airport_transfer_id">Airport Transfer</Label>
                          <Select name="airport_transfer_id" defaultValue={editingBooking?.airport_transfer_id} onValueChange={(value) => handleComponentChange(value, 'airport_transfer_id')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select airport transfer" />
                            </SelectTrigger>
                            <SelectContent>
                              {airportTransfers.map((transfer) => (
                                <SelectItem key={transfer.airport_transfer_id} value={transfer.airport_transfer_id}>
                                  {transfer.transport_type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="airport_transfer_quantity">Airport Transfer Quantity</Label>
                          <Input name="airport_transfer_quantity" type="number" defaultValue={editingBooking?.airport_transfer_quantity} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="rounded-lg pt-4 border-t border-muted">
                      <div className="flex items-center gap-2 mb-6">
                        <CreditCard className="h-5 w-5" />
                        <h4 className="text-lg font-semibold">Payment Information</h4>
                      </div>
                      
                      {/* Price Comparison */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-muted-foreground mb-3">Price Comparison</h5>
                        <div className="grid grid-cols-2 gap-6 p-4 bg-background rounded-lg border">
                          <div>
                            <Label className="text-sm text-muted-foreground">Original Price</Label>
                            <p className="font-bold mt-1 text-sm">
                              £{editingBooking?.total_sold_for_local?.toLocaleString() || "0"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Amended Price</Label>
                            <p className="font-bold mt-1 text-sm">
                              {calculateTotals(formData).formattedTotal}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Schedule */}
                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-3">Payment Schedule</h5>
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map((num) => {
                            const paymentAmount = editingBooking?.[`payment_${num}`] || 0;
                            const paymentStatus = editingBooking?.[`payment_${num}_status`] || "Pending";
                            const isPaid = paymentStatus === "Paid";
                            const newTotal = calculateTotals(formData).total;
                            const paidAmount = [1, 2, 3].reduce((sum, n) => {
                              return sum + (editingBooking?.[`payment_${n}_status`] === "Paid" ? (editingBooking?.[`payment_${n}`] || 0) : 0);
                            }, 0);
                            const remainingAmount = newTotal - paidAmount;
                            const duePayments = [1, 2, 3].filter(n => editingBooking?.[`payment_${n}_status`] !== "Paid").length;
                            const amendedAmount = isPaid ? paymentAmount : (duePayments > 0 ? remainingAmount / duePayments : 0);

                            return (
                              <div key={num} className="p-3 bg-background rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="text-sm font-semibold">Payment {num}</h6>
                                  <Badge variant={isPaid ? "default" : "secondary"} className="text-xs">
                                    {isPaid ? "Paid" : "Due"}
                                  </Badge>
                                </div>
                                <div className="space-y-1">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Amount</Label>
                                    <p className="text-sm font-semibold">£{amendedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                  </div>
                                  {!isPaid && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Due Date</Label>
                                      <p className="text-sm font-semibold">
                                        {formatDateForDisplay(editingBooking?.[`payment_${num}_date`])}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {isPaid ? "Original payment amount" : "Amended payment amount"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Payment Status */}
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* Add Itinerary Dialog */}
      <Dialog open={isItineraryDialogOpen} onOpenChange={setIsItineraryDialogOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Itinerary - {viewingItinerary?.booking.booking_ref}
            </DialogTitle>
          </DialogHeader>
          {viewingItinerary && (
            <ItineraryPDF 
              bookingData={viewingItinerary.booking} 
              itinerary={viewingItinerary.itinerary} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { BookingsTable };
