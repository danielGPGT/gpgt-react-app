import { useEffect, useState } from "react";
import api from "@/lib/api";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function BookingsOpsTable() {
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
  const itemsPerPage = 10;

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
    total_sold_local: "Total Sold For Local",
    total_sold_gbp: "Total Sold GBP",
    pnl: "P&L"
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("bookingFile");
      setBookings(response.data);
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

  // Filter functions
  const filterBookings = (items) => {
    return items.filter((item) => {
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
  };

  // Delete booking
  const handleDeleteBooking = async (bookingId) => {
    setBookingToDelete(bookingId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`bookingFile/${bookingToDelete}`);
      setBookings((prevBookings) =>
        prevBookings.filter(
          (booking) => booking.booking_id !== bookingToDelete
        )
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
      if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
        return new Date(year, monthIndex, day);
      }
      
      // Handle YYYY-MM-DD format
      return new Date(dateStr);
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return null;
    }
  };

  const formatDateForBackend = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return dateStr; // Return original if formatting fails
    }
  };

  const handleEditBooking = async (formData) => {
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Starting update for booking:', editingBooking.booking_id);
      
      // Convert form data to array of updates, but only include changed fields
      const updates = Object.entries(formData)
        .filter(([column, value]) => {
          // Skip booking_id field as it's managed by the backend
          if (column === 'booking_id') return false;
          
          // Compare with original value, handling different data types
          const originalValue = editingBooking[column];
          
          // Special handling for date fields
          if (column.includes('date') || column === 'booking_date' || column === 'check_in_date' || 
              column === 'check_out_date' || column === 'payment_1_date' || column === 'payment_2_date' || 
              column === 'payment_3_date' || column === 'ticketing_deadline') {
            // Format both values to DD-MMM-YYYY for comparison
            const formattedOriginal = formatDateForBackend(originalValue);
            const formattedNew = formatDateForBackend(value);
            
            console.log(`Date comparison for ${column}:`, {
              originalValue,
              newValue: value,
              formattedOriginal,
              formattedNew,
              isDifferent: formattedOriginal !== formattedNew
            });
            
            return formattedOriginal !== formattedNew;
          }
          
          // Handle numbers
          if (typeof originalValue === 'number') {
            return Number(value) !== originalValue;
          }
          
          // Handle other types
          return String(value) !== String(originalValue);
        })
        .map(([column, value]) => {
          // Format date fields
          if (column.includes('date') || column === 'booking_date' || column === 'check_in_date' || 
              column === 'check_out_date' || column === 'payment_1_date' || column === 'payment_2_date' || 
              column === 'payment_3_date' || column === 'ticketing_deadline') {
            return {
              column: bookingFieldMappings[column] || column,
              value: formatDateForBackend(value)
            };
          }
          return {
            column: bookingFieldMappings[column] || column,
            value
          };
        });

      console.log('Updates to process:', updates);

      // Make individual cell updates only for changed fields
      for (const update of updates) {
        console.log('Updating field:', update.column);
        const response = await api.put(`bookingFile/booking_id/${editingBooking.booking_id}`, {
          column: update.column,
          value: update.value
        });
        
        if (!response.data) {
          throw new Error('Update failed');
        }
      }

      console.log('All updates completed successfully');
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
    if (!dateStr) return '';
    const months = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const [day, month, year] = dateStr.split('-');
    return `${year}-${months[month]}-${day.padStart(2, '0')}`;
  };

  // Add this helper function to format dates for the date picker
  const formatDateForDatePicker = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Handle DD-MMM-YYYY format (e.g., "06-May-2025")
      if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();
        return new Date(year, monthIndex, day);
      }
      return new Date(dateStr);
    } catch (error) {
      console.error('Error parsing date for date picker:', dateStr, error);
      return null;
    }
  };

  // Add this helper function to format dates for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return format(date, 'dd-MMM-yyyy');
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
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Booking Ref</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Booker</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((booking) => (
              <TableRow key={booking.booking_id}>
                <TableCell className="font-medium">
                  {booking.booking_ref}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>{booking.event_name}</TableCell>
                <TableCell>{booking.package_type}</TableCell>
                <TableCell>{booking.booker_name}</TableCell>
                <TableCell>{booking.booking_date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setViewingBooking(booking);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingBooking(booking);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBooking(booking.booking_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
            <AlertDialogTitle className="text-green-600">
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
        <DialogContent className="max-w-[1600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Detailed information for booking {viewingBooking?.booking_ref}
            </DialogDescription>
          </DialogHeader>
          {viewingBooking && (
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">
                        Booking Reference:
                      </span>
                      <span className="ml-2">{viewingBooking.booking_ref}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          viewingBooking.status === "Future"
                            ? "default"
                            : "secondary"
                        }
                        className="ml-2"
                      >
                        {viewingBooking.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Booking Type:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.booking_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Consultant:</span>
                      <span className="ml-2">{viewingBooking.consultant}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Acquisition:
                      </span>
                      <span className="ml-2">{viewingBooking.acquisition}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ATOL/ABTOT:</span>
                      <span className="ml-2">{viewingBooking.atol_abtot}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Booking Date:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.booking_date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Event Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Sport:</span>
                      <span className="ml-2">{viewingBooking.sport}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Event:</span>
                      <span className="ml-2">{viewingBooking.event_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Package Type:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.package_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booker Information */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Booker Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2">{viewingBooking.booker_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">
                        {viewingBooking.booker_email}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2">
                        {viewingBooking.booker_phone}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address:</span>
                      <pre className="ml-2 whitespace-pre-wrap">
                        {viewingBooking.booker_address}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Lead Traveller Information */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Lead Traveller Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2">
                        {viewingBooking.lead_traveller_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">
                        {viewingBooking.lead_traveller_email}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2">
                        {viewingBooking.lead_traveller_phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adults:</span>
                      <span className="ml-2">{viewingBooking.adults}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        Guest Travellers:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.guest_traveller_names}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Ticket Information */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Ticket Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">
                        Ticket Name:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.ticket_name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">
                        {viewingBooking.ticket_quantity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hotel Information */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Hotel Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Hotel:</span>
                      <span className="ml-2">{viewingBooking.hotel_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Room Category:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.room_category}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Room Type:</span>
                      <span className="ml-2">{viewingBooking.room_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check In:</span>
                      <span className="ml-2">
                        {viewingBooking.check_in_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check Out:</span>
                      <span className="ml-2">
                        {viewingBooking.check_out_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nights:</span>
                      <span className="ml-2">{viewingBooking.nights}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Extra Nights:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.extra_nights}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Room Quantity:</span>
                      <span className="ml-2">{viewingBooking.room_quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Transfer Information */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Transfer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">
                        Airport Transfer:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.airport_transfer_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">
                        {viewingBooking.airport_transfer_quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Circuit Transfer:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.circuit_transfer_type || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">
                        {viewingBooking.circuit_transfer_quantity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flight Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Flight Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Outbound:</span>
                      <span className="ml-2">
                        {viewingBooking.flight_outbound}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inbound:</span>
                      <span className="ml-2">
                        {viewingBooking.flight_inbound}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <span className="ml-2">
                        {viewingBooking.flight_class}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carrier:</span>
                      <span className="ml-2">
                        {viewingBooking.flight_carrier}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <span className="ml-2">
                        {viewingBooking.flight_source}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Booking Reference:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.flight_booking_reference}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Ticketing Deadline:
                      </span>
                      <span className="ml-2">
                        {viewingBooking.ticketing_deadline}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2">
                        {viewingBooking.flight_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">
                        {viewingBooking.flight_quantity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lounge Pass Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    Lounge Pass Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Variant:</span>
                      <span className="ml-2">
                        {viewingBooking.lounge_pass_variant}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">
                        {viewingBooking.lounge_pass_quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[1600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>
              Edit booking details for {editingBooking?.booking_ref}
            </DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status" className="mb-2 block">Status</Label>
                        <Select name="status" defaultValue={editingBooking.status}>
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
                        <Label htmlFor="booking_type" className="mb-2 block">Booking Type</Label>
                        <Select name="booking_type" defaultValue={editingBooking.booking_type}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select booking type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="provisional">Provisional</SelectItem>
                            <SelectItem value="actual">Actual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="consultant" className="mb-2 block">Consultant</Label>
                        <Input name="consultant" defaultValue={editingBooking.consultant} />
                      </div>

                      <div>
                        <Label htmlFor="acquisition" className="mb-2 block">Acquisition</Label>
                        <Input name="acquisition" defaultValue={editingBooking.acquisition} />
                      </div>

                      <div>
                        <Label htmlFor="atol_abtot" className="mb-2 block">ATOL/ABTOT</Label>
                        <Select name="atol_abtot" defaultValue={editingBooking.atol_abtot}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ATOL/ABTOT" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="atol">ATOL</SelectItem>
                            <SelectItem value="abtot">ABTOT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="booking_date" className="mb-2 block">Booking Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !editingBooking.booking_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editingBooking.booking_date ? formatDateForDisplay(formatDateForDatePicker(editingBooking.booking_date)) : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formatDateForDatePicker(editingBooking.booking_date)}
                              onSelect={(date) => {
                                const formData = new FormData(document.querySelector('form'));
                                formData.set('booking_date', format(date, 'yyyy-MM-dd'));
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Booker Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Booker Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booker_name" className="mb-2 block">Booker Name</Label>
                        <Input name="booker_name" defaultValue={editingBooking.booker_name} />
                      </div>

                      <div>
                        <Label htmlFor="booker_email" className="mb-2 block">Booker Email</Label>
                        <Input name="booker_email" type="email" defaultValue={editingBooking.booker_email} />
                      </div>

                      <div>
                        <Label htmlFor="booker_phone" className="mb-2 block">Booker Phone</Label>
                        <Input name="booker_phone" type="tel" defaultValue={editingBooking.booker_phone} />
                      </div>

                      <div className="col-span-2">
                        <Label htmlFor="booker_address" className="mb-2 block">Booker Address</Label>
                        <textarea
                          name="booker_address"
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          defaultValue={editingBooking.booker_address}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lead Traveller Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Lead Traveller Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lead_traveller_name" className="mb-2 block">Lead Traveller Name</Label>
                        <Input name="lead_traveller_name" defaultValue={editingBooking.lead_traveller_name} />
                      </div>

                      <div>
                        <Label htmlFor="lead_traveller_email" className="mb-2 block">Lead Traveller Email</Label>
                        <Input name="lead_traveller_email" type="email" defaultValue={editingBooking.lead_traveller_email} />
                      </div>

                      <div>
                        <Label htmlFor="lead_traveller_phone" className="mb-2 block">Lead Traveller Phone</Label>
                        <Input name="lead_traveller_phone" type="tel" defaultValue={editingBooking.lead_traveller_phone} />
                      </div>

                      <div>
                        <Label htmlFor="guest_traveller_names" className="mb-2 block">Guest Traveller Names</Label>
                        <Input name="guest_traveller_names" defaultValue={editingBooking.guest_traveller_names} />
                      </div>

                      <div>
                        <Label htmlFor="adults" className="mb-2 block">Number of Adults</Label>
                        <Input name="adults" type="number" defaultValue={editingBooking.adults} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Ticket Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Ticket Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ticket_quantity" className="mb-2 block">Ticket Quantity</Label>
                        <Input name="ticket_quantity" type="number" defaultValue={editingBooking.ticket_quantity} />
                      </div>
                    </div>
                  </div>

                  {/* Hotel Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Hotel Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="check_in_date" className="mb-2 block">Check-in Date</Label>
                        <DatePickerWithRange
                          date={{
                            from: formatDateForDatePicker(editingBooking.check_in_date),
                            to: formatDateForDatePicker(editingBooking.check_out_date)
                          }}
                          setDate={(range) => {
                            const formData = new FormData(document.querySelector('form'));
                            if (range?.from) {
                              formData.set('check_in_date', format(range.from, 'yyyy-MM-dd'));
                            }
                            if (range?.to) {
                              formData.set('check_out_date', format(range.to, 'yyyy-MM-dd'));
                            }
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="nights" className="mb-2 block">Nights</Label>
                        <Input name="nights" type="number" defaultValue={editingBooking.nights} />
                      </div>

                      <div>
                        <Label htmlFor="extra_nights" className="mb-2 block">Extra Nights</Label>
                        <Input name="extra_nights" type="number" defaultValue={editingBooking.extra_nights} />
                      </div>

                      <div>
                        <Label htmlFor="room_quantity" className="mb-2 block">Room Quantity</Label>
                        <Input name="room_quantity" type="number" defaultValue={editingBooking.room_quantity} />
                      </div>
                    </div>
                  </div>

                  {/* Transfer Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Transfer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="airport_transfer_quantity" className="mb-2 block">Airport Transfer Quantity</Label>
                        <Input name="airport_transfer_quantity" type="number" defaultValue={editingBooking.airport_transfer_quantity} />
                      </div>

                      <div>
                        <Label htmlFor="circuit_transfer_quantity" className="mb-2 block">Circuit Transfer Quantity</Label>
                        <Input name="circuit_transfer_quantity" type="number" defaultValue={editingBooking.circuit_transfer_quantity} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
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
    </div>
  );
}

export { BookingsOpsTable };
