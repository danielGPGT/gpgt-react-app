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
    // Calculate new component costs
    const ticketCost = parseFloat(formData.get('ticket_quantity') || 0) * 
      (tickets.find(t => t.ticket_id === formData.get('ticket_id'))?.price || 0);
    
    const roomCost = parseFloat(formData.get('room_quantity') || 0) * 
      (rooms.find(r => r.room_id === formData.get('room_id'))?.price || 0);
    
    const airportTransferCost = parseFloat(formData.get('airport_transfer_quantity') || 0) * 
      (airportTransfers.find(t => t.airport_transfer_id === formData.get('airport_transfer_id'))?.price || 0);
    
    const circuitTransferCost = parseFloat(formData.get('circuit_transfer_quantity') || 0) * 
      (circuitTransfers.find(t => t.circuit_transfer_id === formData.get('circuit_transfer_id'))?.price || 0);
    
    const loungePassCost = parseFloat(formData.get('lounge_pass_quantity') || 0) * 
      (loungePasses.find(p => p.lounge_pass_id === formData.get('lounge_pass_id'))?.price || 0);

    let total = ticketCost + roomCost + airportTransferCost + circuitTransferCost + loungePassCost;

    if (total === 0) {
            return {
        totalCost: 0,
        totalSold: 0,
        paymentAmounts: [0, 0, 0],
        amountDue: 0
      };
    }

    // First round to nearest 100 and subtract 2 (exactly like combinedPricing)
    const rounded = Math.ceil(total / 100) * 100 - 2;

    // Apply B2B commission and currency conversion
    let finalTotal;
    if (userRole === "External B2B") {
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
        userRole,
        paymentCurrency: editingBooking?.payment_currency
      });
      finalTotal = 0;
    }

    // Calculate total paid amount
    const totalPaid = paymentHistory.paidAmounts.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate remaining amount to be distributed
    const remainingAmount = finalTotal - totalPaid;
    
    // Calculate new payment amounts
    const paymentAmounts = [1, 2, 3].map(num => {
      const existingPayment = paymentHistory.paidAmounts.find(p => p.num === num) ||
                            paymentHistory.dueAmounts.find(p => p.num === num);
      
      if (existingPayment?.status === 'Paid') {
        return existingPayment.amount; // Keep paid amounts unchanged
      } else if (existingPayment?.status === 'Due') {
        // Distribute remaining amount proportionally based on original due amounts
        const originalDueTotal = paymentHistory.dueAmounts.reduce((sum, p) => sum + p.amount, 0);
        const originalDueAmount = existingPayment.amount;
        const proportion = originalDueTotal > 0 ? originalDueAmount / originalDueTotal : 0;
        return remainingAmount * proportion;
      }
      return 0; // For cancelled or new payments
    });

    // Calculate amount due (sum of due payments)
    const amountDue = paymentAmounts.reduce((total, amount, index) => {
      const status = formData.get(`payment_${index + 1}_status`) || editingBooking?.[`payment_${index + 1}_status`];
      return status === 'Due' ? total + amount : total;
    }, 0);

          return {
      totalCost: finalTotal,
      totalSold: finalTotal, // You might want to adjust this based on your pricing strategy
      paymentAmounts,
      amountDue
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
    // Get the form element
    const form = document.querySelector('form');
    if (!form) return;

    const formData = new FormData(form);

    // If this is a Select component event
    if (name) {
      formData.set(name, value);

      // Special handling for room selection
      if (name === 'room_id') {
        const selectedRoom = rooms.find(r => r.room_id === value);
        const isBookedRoom = value === editingBooking?.room_id;
        
        // If it's the booked room, set quantity to original booking quantity
        if (isBookedRoom) {
          formData.set('room_quantity', editingBooking?.room_quantity);
        }
        // If it's a new room with 0 remaining, prevent selection
        else if (selectedRoom?.remaining <= 0) {
          toast.warning('This room is not available');
          return;
        }
      }
    }
    
    const newTotals = calculateTotals(formData);
    setCalculatedTotals(newTotals);
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
    
    // Initialize payment history with the original booking data
    setPaymentHistory({
      originalTotal: booking.total_sold_for_local || booking.total_sold_gbp,
      paidAmounts: [
        {
          num: 1,
          amount: booking.payment_1,
          date: booking.payment_1_date,
          status: booking.payment_1_status
        },
        {
          num: 2,
          amount: booking.payment_2,
          date: booking.payment_2_date,
          status: booking.payment_2_status
        },
        {
          num: 3,
          amount: booking.payment_3,
          date: booking.payment_3_date,
          status: booking.payment_3_status
        }
      ].filter(payment => payment.status === 'Paid'),
      dueAmounts: [
        {
          num: 1,
          amount: booking.payment_1,
          date: booking.payment_1_date,
          status: booking.payment_1_status
        },
        {
          num: 2,
          amount: booking.payment_2,
          date: booking.payment_2_date,
          status: booking.payment_2_status
        },
        {
          num: 3,
          amount: booking.payment_3,
          date: booking.payment_3_date,
          status: booking.payment_3_status
        }
      ].filter(payment => payment.status === 'Due')
    });

    // Fetch package components
    if (booking.package_id) {
      await fetchPackageComponents(booking.package_id);
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
    try {
      const itinerary = await getItinerary(booking.booking_id);
      if (itinerary) {
        setViewingItinerary({ booking, itinerary: itinerary.content });
        setIsItineraryDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading itinerary:', error);
      toast.error('Failed to load itinerary');
    }
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
            <DialogTitle>Edit Booking - {editingBooking?.booking_ref}</DialogTitle>
            <DialogDescription>
              Make changes to the booking details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 h-full">
            <div className="grid grid-cols-3 gap-6 overflow-y-auto pr-4 max-h-[calc(90vh-8rem)]">
              {/* Package Components */}
              <div className="col-span-3 grid grid-cols-3 gap-6">
                {/* Tickets */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Tickets</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="ticket_id" className="text-sm">Ticket Type</Label>
                      <Select 
                        name="ticket_id" 
                        defaultValue={editingBooking?.ticket_id}
                        onValueChange={(value) => handleComponentChange(value, 'ticket_id')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ticket type" />
                        </SelectTrigger>
                        <SelectContent>
                          {tickets.map((ticket) => (
                            <SelectItem 
                              key={ticket.ticket_id} 
                              value={ticket.ticket_id}
                              disabled={ticket.remaining <= 0 && ticket.ticket_id !== editingBooking?.ticket_id}
                            >
                              {ticket.ticket_name} - £{ticket.price} 
                              {ticket.ticket_id === editingBooking?.ticket_id 
                                ? ` (Currently Booked: ${editingBooking?.ticket_quantity})` 
                                : ` (${ticket.remaining} remaining)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ticket_quantity" className="text-sm">Ticket Quantity</Label>
                      <Input 
                        name="ticket_quantity" 
                        type="number" 
                        min="1"
                        max={tickets.find(t => t.ticket_id === editingBooking?.ticket_id)?.remaining || 0}
                        defaultValue={editingBooking?.ticket_quantity}
                        onChange={(e) => {
                          const selectedTicket = tickets.find(t => t.ticket_id === editingBooking?.ticket_id);
                          const value = parseInt(e.target.value);
                          if (selectedTicket && value > selectedTicket.remaining) {
                            e.target.value = selectedTicket.remaining;
                            toast.warning(`Only ${selectedTicket.remaining} tickets remaining`);
                          }
                          handleInputChange(e);
                        }}
                      />
                      {editingBooking?.ticket_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {tickets.find(t => t.ticket_id === editingBooking.ticket_id)?.remaining <= 0 
                            ? 'Currently booked ticket' 
                            : `${tickets.find(t => t.ticket_id === editingBooking.ticket_id)?.remaining} tickets remaining`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hotel */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Hotel</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="hotel_id" className="text-sm">Hotel</Label>
                      <Select 
                        name="hotel_id" 
                        defaultValue={editingBooking?.hotel_id}
                        onValueChange={(value) => handleComponentChange(value, 'hotel_id')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hotels.map((hotel) => (
                            <SelectItem 
                              key={hotel.hotel_id} 
                              value={hotel.hotel_id}
                            >
                              {hotel.hotel_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room_id" className="text-sm">Room Type</Label>
                      <Select 
                        name="room_id" 
                        defaultValue={editingBooking?.room_id}
                        onValueChange={(value) => handleComponentChange(value, 'room_id')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => {
                            // Check if this is the exact room from the booking
                            const isBookedRoom = room.room_id === editingBooking?.room_id;
                            console.log('Room check:', {
                              roomId: room.room_id,
                              bookingRoomId: editingBooking?.room_id,
                              isBookedRoom,
                              remaining: room.remaining
                            });
                            return (
                              <SelectItem 
                                key={room.room_id} 
                                value={room.room_id}
                                disabled={!isBookedRoom && room.remaining <= 0}
                              >
                                {room.room_category} - {room.room_type} 
                                {room.breakfast_included ? ' (Breakfast Included)' : ''} 
                                - £{room.price} 
                                {isBookedRoom 
                                  ? ` (Currently Booked: ${editingBooking?.room_quantity})` 
                                  : ` (${room.remaining} remaining)`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {editingBooking?.room_id && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <p>
                            {editingBooking?.room_id === rooms.find(r => r.room_id === editingBooking?.room_id)?.room_id 
                              ? `Originally booked: ${editingBooking?.room_quantity} rooms` 
                              : `${rooms.find(r => r.room_id === editingBooking?.room_id)?.remaining} rooms remaining`}
                          </p>
                          <p>
                            Max guests: {rooms.find(r => r.room_id === editingBooking?.room_id)?.max_guests}
                          </p>
                          <p>
                            {rooms.find(r => r.room_id === editingBooking?.room_id)?.nights} nights
                            {rooms.find(r => r.room_id === editingBooking?.room_id)?.extra_night_price && 
                              ` (Extra night: £${rooms.find(r => r.room_id === editingBooking?.room_id)?.extra_night_price})`
                            }
                      </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="room_quantity" className="text-sm">Room Quantity</Label>
                      <Input
                        name="room_quantity" 
                        type="number" 
                        min="1"
                        max={editingBooking?.room_id === rooms.find(r => r.room_id === editingBooking?.room_id)?.room_id 
                          ? editingBooking?.room_quantity 
                          : rooms.find(r => r.room_id === editingBooking?.room_id)?.remaining || 0}
                        defaultValue={editingBooking?.room_quantity}
                        onChange={(e) => {
                          const selectedRoom = rooms.find(r => r.room_id === editingBooking?.room_id);
                          const value = parseInt(e.target.value);
                          if (selectedRoom) {
                            if (value < 1) {
                              e.target.value = 1;
                              toast.warning('Minimum 1 room required');
                            } else if (selectedRoom.room_id === editingBooking?.room_id) {
                              if (value > editingBooking?.room_quantity) {
                                e.target.value = editingBooking?.room_quantity;
                                toast.warning(`Cannot exceed original booking quantity of ${editingBooking?.room_quantity}`);
                              }
                            } else if (value > selectedRoom.remaining) {
                              e.target.value = selectedRoom.remaining;
                              toast.warning(`Only ${selectedRoom.remaining} rooms remaining`);
                            }
                          }
                          handleInputChange(e);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Transfers */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Transfers</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="airport_transfer_id" className="text-sm">Airport Transfer Type</Label>
                      <Select 
                        name="airport_transfer_id" 
                        defaultValue={editingBooking?.airport_transfer_id}
                        onValueChange={(value) => handleComponentChange(value, 'airport_transfer_id')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transfer type" />
                        </SelectTrigger>
                        <SelectContent>
                          {airportTransfers.map((transfer) => (
                            <SelectItem 
                              key={transfer.airport_transfer_id} 
                              value={transfer.airport_transfer_id}
                            >
                              {transfer.transport_type} - Max {transfer.max_capacity} passengers
                              - £{transfer.price} per transfer
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editingBooking?.airport_transfer_id && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>
                            Max capacity: {airportTransfers.find(t => t.airport_transfer_id === editingBooking.airport_transfer_id)?.max_capacity} passengers
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="airport_transfer_quantity" className="text-sm">Number of Transfers</Label>
                      <Input
                        name="airport_transfer_quantity" 
                        type="number" 
                        min="1"
                        defaultValue={editingBooking?.airport_transfer_quantity}
                        onChange={(e) => {
                          const selectedTransfer = airportTransfers.find(t => t.airport_transfer_id === editingBooking?.airport_transfer_id);
                          const value = parseInt(e.target.value);
                          if (selectedTransfer && value < 1) {
                            e.target.value = 1;
                            toast.warning('Minimum 1 transfer required');
                          }
                          handleInputChange(e);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Price per transfer: £{airportTransfers.find(t => t.airport_transfer_id === editingBooking?.airport_transfer_id)?.price || 0}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="circuit_transfer_id" className="text-sm">Circuit Transfer Type</Label>
                      <Select 
                        name="circuit_transfer_id" 
                        defaultValue={editingBooking?.circuit_transfer_id}
                        onValueChange={(value) => handleComponentChange(value, 'circuit_transfer_id')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transfer type" />
                        </SelectTrigger>
                        <SelectContent>
                          {circuitTransfers.map((transfer) => (
                            <SelectItem 
                              key={transfer.circuit_transfer_id} 
                              value={transfer.circuit_transfer_id}
                            >
                              {transfer.transport_type} - {transfer.coach_capacity} seats
                              - £{transfer.price} per person
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editingBooking?.circuit_transfer_id && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>
                            Coach capacity: {circuitTransfers.find(t => t.circuit_transfer_id === editingBooking.circuit_transfer_id)?.coach_capacity} seats
                          </p>
                          <p>
                            Transfer days: {circuitTransfers.find(t => t.circuit_transfer_id === editingBooking.circuit_transfer_id)?.transport_type.match(/\((.*?)\)/)?.[1] || 'All days'}
                      </p>
                    </div>
                      )}
                  </div>
                    <div>
                      <Label htmlFor="circuit_transfer_quantity" className="text-sm">Number of Passengers</Label>
                      <Input 
                        name="circuit_transfer_quantity" 
                        type="number" 
                        min="1"
                        max={circuitTransfers.find(t => t.circuit_transfer_id === editingBooking?.circuit_transfer_id)?.coach_capacity || 0}
                        defaultValue={editingBooking?.circuit_transfer_quantity}
                        onChange={(e) => {
                          const selectedTransfer = circuitTransfers.find(t => t.circuit_transfer_id === editingBooking?.circuit_transfer_id);
                          const value = parseInt(e.target.value);
                          if (selectedTransfer) {
                            if (value < 1) {
                              e.target.value = 1;
                              toast.warning('Minimum 1 passenger required');
                            } else if (value > selectedTransfer.coach_capacity) {
                              e.target.value = selectedTransfer.coach_capacity;
                              toast.warning(`Maximum ${selectedTransfer.coach_capacity} passengers allowed`);
                            }
                          }
                          handleInputChange(e);
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Price per person: £{circuitTransfers.find(t => t.circuit_transfer_id === editingBooking?.circuit_transfer_id)?.price || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lounge Passes */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Lounge Passes</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="lounge_pass_id" className="text-sm">Lounge Type</Label>
                      <Select name="lounge_pass_id" defaultValue={editingBooking?.lounge_pass_id} onValueChange={(value) => handleComponentChange(value, 'lounge_pass_id')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lounge type" />
                        </SelectTrigger>
                        <SelectContent>
                          {loungePasses.map((pass) => (
                            <SelectItem key={pass.lounge_pass_id} value={pass.lounge_pass_id}>
                              {pass.lounge_pass_variant} - £{pass.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lounge_pass_quantity" className="text-sm">Quantity</Label>
                      <Input name="lounge_pass_quantity" type="number" defaultValue={editingBooking?.lounge_pass_quantity} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    {getEditableFields().includes("status") && (
                    <div>
                        <Label htmlFor="status" className="text-sm">Status</Label>
                        <Select name="status" defaultValue={editingBooking?.status} onValueChange={(value) => handleComponentChange(value, 'status')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    )}
                    {getEditableFields().includes("package_type") && (
                    <div>
                        <Label htmlFor="package_type" className="text-sm">Package Type</Label>
                        <Select name="package_type" defaultValue={editingBooking?.package_type} onValueChange={(value) => handleComponentChange(value, 'package_type')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select package type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    )}
                    {getEditableFields().includes("payment_status") && (
                    <div>
                        <Label htmlFor="payment_status" className="text-sm">Payment Status</Label>
                        <Select name="payment_status" defaultValue={editingBooking?.payment_status} onValueChange={(value) => handleComponentChange(value, 'payment_status')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    )}
                  </div>
                </div>

                {/* Payment Schedule */}
                <div className="bg-muted/50 p-4 rounded-lg col-span-3">
                  <h4 className="font-medium mb-3">Payment Schedule</h4>
                  <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((num) => {
                      const isPaid = editingBooking?.[`payment_${num}_status`] === "Paid";
                      const payment = paymentHistory.paidAmounts.find(p => p.num === num) ||
                                     paymentHistory.dueAmounts.find(p => p.num === num);
                      
                      return (
                        <div key={num} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium">Payment {num}</h5>
                            <Badge
                              className={`${
                                isPaid
                                  ? "bg-success text-success-foreground"
                                  : editingBooking?.[`payment_${num}_status`] === "Due"
                                  ? "bg-warning text-warning-foreground"
                                  : "bg-destructive text-destructive-foreground"
                              }`}
                            >
                              {editingBooking?.[`payment_${num}_status`]}
                            </Badge>
                    </div>
                    <div>
                            <Label htmlFor={`payment_${num}`} className="text-sm">
                              Amount ({editingBooking?.payment_currency})
                              {isPaid && <span className="text-xs text-muted-foreground ml-1">(Paid)</span>}
                            </Label>
                            <Input
                              name={`payment_${num}`}
                              type="number"
                              step="0.01"
                              value={calculatedTotals.paymentAmounts[num - 1]}
                              disabled={isPaid}
                              readOnly
                              className={isPaid ? "bg-muted" : ""}
                            />
                            {payment && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {isPaid ? 'Paid on ' : 'Due on '}
                                {formatDateForDisplay(payment.date)}
                              </p>
                            )}
                    </div>
                    <div>
                            <Label htmlFor={`payment_${num}_date`} className="text-sm">Due Date</Label>
                            <Input
                              name={`payment_${num}_date`}
                              type="date"
                              defaultValue={formatDateForInput(editingBooking?.[`payment_${num}_date`])}
                              disabled={isPaid}
                            />
                    </div>
                    <div>
                            <Label htmlFor={`payment_${num}_status`} className="text-sm">Status</Label>
                            <Select
                              name={`payment_${num}_status`}
                              defaultValue={editingBooking?.[`payment_${num}_status`]}
                              onValueChange={(value) => handlePaymentStatusChange(num, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Due">Due</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                    </div>
                    </div>
                      );
                    })}
                    </div>
                  <div className="mt-4 grid grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="amount_due" className="text-sm">Amount Due</Label>
                      <Input
                        name="amount_due"
                        type="number"
                        step="0.01"
                        value={calculatedTotals.amountDue}
                        disabled
                        readOnly
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_sold_gbp" className="text-sm">Total Sold (GBP)</Label>
                      <Input
                        name="total_sold_gbp"
                        type="number"
                        step="0.01"
                        value={calculatedTotals.totalSold}
                        disabled={!getEditableFields().includes("total_sold_gbp")}
                        readOnly
                      />
                    </div>
                    {getEditableFields().includes("total_cost") && (
                    <div>
                        <Label htmlFor="total_cost" className="text-sm">Total Cost</Label>
                        <Input
                          name="total_cost"
                          type="number"
                          step="0.01"
                          value={calculatedTotals.totalCost}
                          readOnly
                        />
                    </div>
                    )}
                    </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Payment Summary</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Original Total:</span>
                        <span className="ml-2">{currencySymbols[editingBooking?.payment_currency || 'GBP']}{paymentHistory.originalTotal.toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">New Total:</span>
                        <span className="ml-2">{currencySymbols[editingBooking?.payment_currency || 'GBP']}{calculatedTotals.totalCost.toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Total Paid:</span>
                        <span className="ml-2">{currencySymbols[editingBooking?.payment_currency || 'GBP']}{paymentHistory.paidAmounts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Amount Due:</span>
                        <span className="ml-2">{currencySymbols[editingBooking?.payment_currency || 'GBP']}{calculatedTotals.amountDue.toLocaleString()}</span>
                    </div>
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
