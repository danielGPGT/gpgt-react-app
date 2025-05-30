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
  const itemsPerPage = 15;

  // Add sorting state
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  // Define sortable columns
  const sortColumns = [
    { value: null, label: "No Sorting" },
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

  const currencySymbols = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    AUD: "A$",
    CAD: "C$",
    NZD: "NZ$",
    JPY: "¥",
    CHF: "Fr",
    CNY: "¥",
    INR: "₹",
    BRL: "R$",
    ZAR: "R",
    SGD: "S$",
    HKD: "HK$",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    MXN: "Mex$",
    RUB: "₽",
    TRY: "₺",
    KRW: "₩",
    THB: "฿",
    IDR: "Rp",
    MYR: "RM",
    PHP: "₱",
    VND: "₫",
  };

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

  const handleEditBooking = async (formData) => {
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    // If status is being set to Cancelled, set all quantity fields to 0
    if (formData.status === "Cancelled") {
      formData.ticket_quantity = 0;
      formData.room_quantity = 0;
      formData.airport_transfer_quantity = 0;
      formData.circuit_transfer_quantity = 0;
      formData.payment_1_status = "Cancelled";
      formData.payment_2_status = "Cancelled";
      formData.payment_3_status = "Cancelled";
    }

    try {
      setIsSubmitting(true);
      console.log("Starting update for booking:", editingBooking.booking_id);

      // Convert form data to array of updates, but only include changed fields
      const updates = Object.entries(formData)
        .filter(([column, value]) => {
          // Skip booking_id field as it's managed by the backend
          if (column === "booking_id") return false;

          // Compare with original value, handling different data types
          const originalValue = editingBooking[column];

          // Special handling for date fields
          if (
            column.includes("date") ||
            column === "booking_date" ||
            column === "check_in_date" ||
            column === "check_out_date" ||
            column === "payment_1_date" ||
            column === "payment_2_date" ||
            column === "payment_3_date" ||
            column === "ticketing_deadline"
          ) {
            // Format both values to DD-MMM-YYYY for comparison
            const formattedOriginal = formatDateForBackend(originalValue);
            const formattedNew = formatDateForBackend(value);

            console.log(`Date comparison for ${column}:`, {
              originalValue,
              newValue: value,
              formattedOriginal,
              formattedNew,
              isDifferent: formattedOriginal !== formattedNew,
            });

            return formattedOriginal !== formattedNew;
          }

          // Handle numbers
          if (typeof originalValue === "number") {
            return Number(value) !== originalValue;
          }

          // Handle other types
          return String(value) !== String(originalValue);
        })
        .map(([column, value]) => {
          // Format date fields
          if (
            column.includes("date") ||
            column === "booking_date" ||
            column === "check_in_date" ||
            column === "check_out_date" ||
            column === "payment_1_date" ||
            column === "payment_2_date" ||
            column === "payment_3_date" ||
            column === "ticketing_deadline"
          ) {
            return {
              column: bookingFieldMappings[column] || column,
              value: formatDateForBackend(value),
            };
          }
          return {
            column: bookingFieldMappings[column] || column,
            value,
          };
        });

      console.log("Updates to process:", updates);

      // Make individual cell updates only for changed fields
      for (const update of updates) {
        console.log("Updating field:", update.column);
        const response = await api.put(
          `bookingFile/booking_id/${editingBooking.booking_id}`,
          {
            column: update.column,
            value: update.value,
          }
        );

        if (!response.data) {
          throw new Error("Update failed");
        }
      }

      console.log("All updates completed successfully");
      await fetchBookings(); // Refresh the bookings list
      setIsEditDialogOpen(false);
      setEditingBooking(null);
      toast.success("Booking updated successfully");
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    handleEditBooking(data);
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

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading bookings...
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">View and edit Bookings</h3>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {getUniqueValues("status").map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.event}
          onValueChange={(value) => setFilters({ ...filters, event: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {getUniqueValues("event_name").map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.package}
          onValueChange={(value) => setFilters({ ...filters, package: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            {getUniqueValues("package_type").map((pkg) => (
              <SelectItem key={pkg} value={pkg}>
                {pkg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.consultant}
          onValueChange={(value) =>
            setFilters({ ...filters, consultant: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Consultant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Consultants</SelectItem>
            {getUniqueValues("consultant").map((consultant) => (
              <SelectItem key={consultant} value={consultant}>
                {consultant}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Label>Booking Date:</Label>
          <DatePickerWithRange
            date={filters.bookingDateRange}
            setDate={(range) =>
              setFilters({ ...filters, bookingDateRange: range })
            }
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({
                ...filters,
                bookingDateRange: { from: null, to: null },
              })
            }
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="flex items-center gap-2 p-2 justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="flex items-center gap-2">
                  Sort <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                {sortColumns.map((col) => (
                  <DropdownMenuItem
                    key={col.value}
                    onClick={() => setSortColumn(col.value)}
                    className={
                      sortColumn === col.value
                        ? "font-semibold text-primary"
                        : ""
                    }
                  >
                    {col.label} {sortColumn === col.value && "✓"}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Direction</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSortDirection("asc")}
                  className={
                    sortDirection === "asc"
                      ? "font-semibold text-primary"
                      : ""
                  }
                >
                  Ascending {sortDirection === "asc" && "▲"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortDirection("desc")}
                  className={
                    sortDirection === "desc"
                      ? "font-semibold text-primary"
                      : ""
                  }
                >
                  Descending {sortDirection === "desc" && "▼"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground">
              {sortColumn ? (
                <>
                  Sorted by{" "}
                  <span className="font-medium">
                    {sortColumns.find((c) => c.value === sortColumn)?.label}
                  </span>{" "}
                  ({sortDirection === "asc" ? "A-Z" : "Z-A"})
                </>
              ) : (
                "No sorting applied"
              )}
            </span>
          </div>

          {selectedBookings.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedBookings.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    Bulk Actions <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleBulkGenerateItineraries}
                    disabled={isBulkGenerating}
                  >
                    {isBulkGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate New Itineraries
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleBulkUpdateItineraries}
                    disabled={isBulkGenerating}
                  >
                    {isBulkGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update Existing Itineraries
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedBookings.length === currentItems.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="text-xs py-2">Booking Ref</TableHead>
              <TableHead className="text-xs py-2">Status</TableHead>
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Package</TableHead>
              <TableHead className="text-xs py-2">Booker</TableHead>
              <TableHead className="text-xs py-2">Booking Date</TableHead>
              <TableHead className="text-xs py-2">Total Cost</TableHead>
              <TableHead className="text-xs py-2">Total Sold (GBP)</TableHead>
              <TableHead className="text-xs py-2">P&L</TableHead>
              <TableHead className="text-xs py-2">Payment Status</TableHead>
              <TableHead className="text-xs py-2">Itinerary</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((booking) => (
              <TableRow key={booking.booking_id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedBookings.some(b => b.booking_id === booking.booking_id)}
                    onCheckedChange={() => handleSelectBooking(booking)}
                    aria-label={`Select booking ${booking.booking_ref}`}
                  />
                </TableCell>
                <TableCell className="text-xs py-1.5 font-medium">
                  {booking.booking_ref}
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <Badge variant="secondary">{booking.status}</Badge>
                </TableCell>
                <TableCell className="text-xs py-1.5">{booking.event_name}</TableCell>
                <TableCell className="text-xs py-1.5">{booking.package_type}</TableCell>
                <TableCell className="text-xs py-1.5">{booking.booker_name}</TableCell>
                <TableCell className="text-xs py-1.5">{booking.booking_date}</TableCell>
                <TableCell className="text-xs py-1.5">£ {booking.total_cost.toLocaleString()}</TableCell>
                <TableCell className="text-xs py-1.5">
                  £ {booking.total_sold_gbp.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <span
                    className={
                      booking["p&l"] >= 0 ? "text-success" : "text-destructive"
                    }
                  >
                    £ {booking["p&l"].toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-xs py-1.5">
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
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  {bookingsWithItineraries.has(booking.booking_id) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 h-6 px-2"
                      onClick={() => handleViewItinerary(booking)}
                    >
                      <FileText className="h-3 w-3" />
                      <span>View Itinerary</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Not Generated
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setViewingBooking(booking);
                        setIsViewDialogOpen(true);
                      }}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingBooking(booking);
                        setIsEditDialogOpen(true);
                      }}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBooking(booking.booking_id)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
                <h3 className="text-sm font-semibold mb-2">
                  Booker Information
                </h3>
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

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>
              Edit Booking - {editingBooking?.booking_ref}
            </DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <form onSubmit={handleSubmit}>
              <div className="w-full columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {/* Basic Information */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="status" className="text-xs">
                        Status
                      </Label>
                      <Select name="status" defaultValue={editingBooking.status}>
                        <SelectTrigger className="h-8">
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
                      <Label htmlFor="booking_type" className="text-xs">
                        Booking Type
                      </Label>
                      <Select name="booking_type" defaultValue={editingBooking.booking_type}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select booking type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="provisional">Provisional</SelectItem>
                          <SelectItem value="actual">Actual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="consultant" className="text-xs">
                        Consultant
                      </Label>
                      <p className="text-sm font-medium mt-1">
                        {editingBooking.consultant}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="acquisition" className="text-xs">
                        Acquisition
                      </Label>
                      <Input
                        name="acquisition"
                        defaultValue={editingBooking.acquisition}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="atol_abtot" className="text-xs">
                        ATOL/ABTOT
                      </Label>
                      <Select name="atol_abtot" defaultValue={editingBooking.atol_abtot}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select ATOL/ABTOT" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="atol">ATOL</SelectItem>
                          <SelectItem value="abtot">ABTOT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="booking_date" className="text-xs">
                        Booking Date
                      </Label>
                      <Input
                        name="booking_date"
                        type="date"
                        defaultValue={formatDateForInput(editingBooking.booking_date)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sport" className="text-xs">
                        Sport
                      </Label>
                      <p className="text-sm font-medium mt-1">
                        {editingBooking.sport}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="event_name" className="text-xs">
                        Event
                      </Label>
                      <p className="text-sm font-medium mt-1">
                        {editingBooking.event_name}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="package_type" className="text-xs">
                        Package Type
                      </Label>
                      <p className="text-sm font-medium mt-1">
                        {editingBooking.package_type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booker Information */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4 ">
                  <h3 className="text-sm font-semibold mb-2">Booker Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="booker_name" className="text-xs">Name</Label>
                      <Input name="booker_name" defaultValue={editingBooking.booker_name} className="h-8" />
                    </div>
                    <div>
                      <Label htmlFor="booker_email" className="text-xs">Email</Label>
                      <Input name="booker_email" type="email" defaultValue={editingBooking.booker_email} className="h-8" />
                    </div>
                    <div>
                      <Label htmlFor="booker_phone" className="text-xs">Phone</Label>
                      <Input name="booker_phone" type="tel" defaultValue={editingBooking.booker_phone} className="h-8" />
                    </div>
                    <div>
                      <Label htmlFor="booker_address" className="text-xs">Address</Label>
                      <textarea name="booker_address" className="w-full min-h-[120px] p-2 border rounded-md text-sm" defaultValue={editingBooking.booker_address} />
                    </div>
                  </div>
                </div>

                {/* Lead Traveller */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold mb-2">Lead Traveller</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="lead_traveller_name" className="text-xs">Name</Label>
                      <Input name="lead_traveller_name" defaultValue={editingBooking.lead_traveller_name} className="h-8" />
                    </div>
                    <div>
                      <Label htmlFor="lead_traveller_email" className="text-xs">Email</Label>
                      <Input name="lead_traveller_email" type="email" defaultValue={editingBooking.lead_traveller_email} className="h-8" />
                    </div>
                    <div>
                      <Label htmlFor="lead_traveller_phone" className="text-xs">Phone</Label>
                      <Input name="lead_traveller_phone" type="tel" defaultValue={editingBooking.lead_traveller_phone} className="h-8" />
                    </div>
                    <div>
                      <Label htmlFor="adults" className="text-xs">Adults</Label>
                      <Input name="adults" type="number" defaultValue={editingBooking.adults} className="h-8" />
                    </div>
                    <div>
                      <Label htmlFor="guest_traveller_names" className="text-xs">Guest Travellers</Label>
                      <Input name="guest_traveller_names" defaultValue={editingBooking.guest_traveller_names} className="h-8" />
                    </div>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold mb-2">Ticket Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Ticket Name</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.ticket_name} x {editingBooking.ticket_quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Cost</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.ticket_cost?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.ticket_price?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </div>

                {/* Hotel Information */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold mb-2">Hotel Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Hotel Name</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.hotel_name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Room Type</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.room_type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Check-in/Check-out Dates</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.check_in_date} - {editingBooking.check_out_date}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Nights</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.nights} {editingBooking.extra_nights ? `(+${editingBooking.extra_nights})` : ""}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Room Cost</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.room_cost?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Room Price</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.room_price?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </div>

                {/* Transfer Information */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold mb-2">Transfer Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Airport Transfer Type</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.airport_transfer_type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Quantity</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.airport_transfer_quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Cost</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.airport_transfer_cost?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.airport_transfer_price?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Circuit Transfer Type</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.circuit_transfer_type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Quantity</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.circuit_transfer_quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Cost</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.circuit_transfer_cost?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.circuit_transfer_price?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </div>

                {/* Flight Information */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold mb-2">Flight Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Outbound</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_outbound}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Inbound</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_inbound}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Class</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_class}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Carrier</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_carrier}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Source</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_source}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Booking Reference</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_booking_reference}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Ticketing Deadline</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.ticketing_deadline}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_status}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Quantity</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.flight_quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Cost</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.flight_cost?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.flight_price?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </div>

                {/* Lounge Pass Information */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold mb-2">Lounge Pass Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Variant</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.lounge_pass_variant}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Quantity</span>
                      <p className="text-sm font-medium mt-1">{editingBooking.lounge_pass_quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Cost</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.lounge_pass_cost?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="text-sm font-medium mt-1">£{editingBooking.lounge_pass_price?.toLocaleString() || "0"}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="break-inside-avoid bg-muted/50 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-semibold mb-2">Payment Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Currency</span>
                      <p className="text-sm font-medium">{getCurrencySymbol(editingBooking.payment_currency)} ({editingBooking.payment_currency})</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Cost</span>
                      <p className="text-sm font-medium">£{editingBooking.total_cost?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Sold (Local)</span>
                      <p className="text-sm font-medium">{getCurrencySymbol(editingBooking.payment_currency)}{editingBooking.total_sold_for_local?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Sold (GBP)</span>
                      <p className="text-sm font-medium">£{editingBooking.total_sold_gbp?.toLocaleString() || "0"}</p>
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
                          <TableHead className="py-1 pr-4 font-normal">Payment</TableHead>
                          <TableHead className="py-1 pr-4 font-normal">Amount</TableHead>
                          <TableHead className="py-1 font-normal">Due Date</TableHead>
                          <TableHead className="py-1 pr-4 font-normal">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[1, 2, 3].map((num) => (
                          <TableRow key={num} className="align-top">
                            <TableCell className="py-1 pr-4 font-medium">{`Payment ${num}`}</TableCell>
                            <TableCell className="py-1 pr-4">{getCurrencySymbol(editingBooking.payment_currency)}{editingBooking[`payment_${num}`]?.toLocaleString() || "0"}</TableCell>
                            <TableCell className="py-1">{editingBooking[`payment_${num}_date`]}</TableCell>
                            <TableCell className="py-1 pr-4">
                              <Select name={`payment_${num}_status`} defaultValue={editingBooking[`payment_${num}_status`]}>
                                <SelectTrigger className="h-8 min-w-[90px]">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Paid">Paid</SelectItem>
                                  <SelectItem value="Due">Due</SelectItem>
                                  <SelectItem value="Overdue">Overdue</SelectItem>
                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Amount Due</span>
                      <p className="text-sm font-medium mt-1">{getCurrencySymbol(editingBooking.payment_currency)} {editingBooking.amount_due?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <div className="mt-0.5">
                        <Badge className={`${editingBooking.payment_status === "Paid" ? "bg-success text-success-foreground" : editingBooking.payment_status === "Cancelled" ? "bg-secondary text-secondary-foreground" : "bg-destructive text-destructive-foreground"}`}>{editingBooking.payment_status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
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
          )}
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
