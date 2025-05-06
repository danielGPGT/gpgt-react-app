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
          // Compare with original value, handling different data types
          const originalValue = editingBooking[column];
          if (typeof originalValue === 'number') {
            return Number(value) !== originalValue;
          }
          return String(value) !== String(originalValue);
        })
        .map(([column, value]) => ({
          column,
          value
        }));

      console.log('Updates to process:', updates.length);

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
              <TableHead>Total Cost</TableHead>
              <TableHead>Total Sold (GBP)</TableHead>
              <TableHead>P&L</TableHead>
              <TableHead>Payment Status</TableHead>
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
                <TableCell>£ {booking.total_cost.toLocaleString()}</TableCell>
                <TableCell>
                  £ {booking.total_sold_gbp.toLocaleString()}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      booking["p&l"] >= 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    £ {booking["p&l"].toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={`${
                      booking.payment_status === "Paid" ? "bg-[#4CAF50] text-white" : 
                      booking.payment_status === "Cancelled" ? "bg-secondary text-black" : 
                      "bg-[#DE3B3D] text-white"
                    }`}
                  >
                    {booking.payment_status}
                  </Badge>
                </TableCell>
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
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Guest Travellers</h3>
                  <div className="grid grid-cols-2 gap-2">
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
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">
                        £{viewingBooking.ticket_cost || "0"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">
                        £{viewingBooking.ticket_price}
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
                      <span className="text-muted-foreground">Room Cost:</span>
                      <span className="ml-2">£{viewingBooking.room_cost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Room Price:</span>
                      <span className="ml-2">£{viewingBooking.room_price}</span>
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
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">
                        £{viewingBooking.airport_transfer_cost}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">
                        £{viewingBooking.airport_transfer_price}
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
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">
                        £{viewingBooking.flight_cost}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">
                        £{viewingBooking.flight_price}
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
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">
                        £{viewingBooking.lounge_pass_cost}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">
                        £{viewingBooking.lounge_pass_price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="ml-2">
                        {getCurrencySymbol(viewingBooking.payment_currency)} (
                        {viewingBooking.payment_currency})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="ml-2">
                        £ {viewingBooking.total_cost}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Sold (Local):
                      </span>
                      <span className="ml-2">
                        {getCurrencySymbol(viewingBooking.payment_currency)}{" "}
                        {viewingBooking.total_sold_for_local}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Sold (GBP):
                      </span>
                      <span className="ml-2">
                        £ {viewingBooking.total_sold_gbp}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">P&L:</span>
                      <span
                        className={`ml-2 ${
                          viewingBooking["p&l"] >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        £ {viewingBooking["p&l"]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="font-semibold mb-2 mt-4">
                      Payment Schedule:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">
                          Payment 1:
                        </span>
                        <span className="ml-2">
                          {getCurrencySymbol(viewingBooking.payment_currency)}{" "}
                          {viewingBooking.payment_1} due{" "}
                          {viewingBooking.payment_1_date}
                        </span>
                        <Badge
                          className={`ml-2 ${
                            viewingBooking.payment_1_status === "Paid"
                              ? "bg-[#4CAF50] text-white"
                              : viewingBooking.payment_1_status === "Due"
                              ? "bg-[#FFC107] text-white"
                              : "bg-[#DE3B3D] text-white"
                          }`}
                        >
                          {viewingBooking.payment_1_status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Payment 2:
                        </span>
                        <span className="ml-2">
                          {getCurrencySymbol(viewingBooking.payment_currency)}{" "}
                          {viewingBooking.payment_2} due{" "}
                          {viewingBooking.payment_2_date}
                        </span>
                        <Badge
                          className={`ml-2 ${
                            viewingBooking.payment_2_status === "Paid"
                              ? "bg-[#4CAF50] text-white"
                              : viewingBooking.payment_2_status === "Due"
                              ? "bg-[#FFC107] text-white"
                              : "bg-[#DE3B3D] text-white"
                          }`}
                        >
                          {viewingBooking.payment_2_status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Payment 3:
                        </span>
                        <span className="ml-2">
                          {getCurrencySymbol(viewingBooking.payment_currency)}{" "}
                          {viewingBooking.payment_3} due{" "}
                          {viewingBooking.payment_3_date}
                        </span>
                        <Badge
                          className={`ml-2 ${
                            viewingBooking.payment_3_status === "Paid"
                              ? "bg-[#4CAF50] text-white"
                              : viewingBooking.payment_3_status === "Due"
                              ? "bg-[#FFC107] text-white"
                              : "bg-[#DE3B3D] text-white"
                          }`}
                        >
                          {viewingBooking.payment_3_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Amount Due:</span>
                      <span className="ml-2">
                        {getCurrencySymbol(viewingBooking.payment_currency)}{" "}
                        {viewingBooking.amount_due}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment Status:</span>
                      <Badge 
                        className={`ml-2 ${
                          viewingBooking.payment_status === "Paid" ? "bg-[#4CAF50] text-white" : 
                          viewingBooking.payment_status === "Cancelled" ? "bg-secondary text-black" : 
                          "bg-[#DE3B3D] text-white"
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
                            <SelectItem value="confirmed">Confirmed</SelectItem>
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
                        <Input 
                          name="booking_date" 
                          type="date" 
                          defaultValue={formatDateForInput(editingBooking.booking_date)} 
                        />
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

                      <div>
                        <Label htmlFor="ticket_price" className="mb-2 block">Ticket Price</Label>
                        <Input name="ticket_price" type="number" step="0.01" defaultValue={editingBooking.ticket_price} />
                      </div>
                    </div>
                  </div>

                  {/* Hotel Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Hotel Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="check_in_date" className="mb-2 block">Check-in Date</Label>
                        <Input 
                          name="check_in_date" 
                          type="date" 
                          defaultValue={formatDateForInput(editingBooking.check_in_date)} 
                        />
                      </div>

                      <div>
                        <Label htmlFor="check_out_date" className="mb-2 block">Check-out Date</Label>
                        <Input 
                          name="check_out_date" 
                          type="date" 
                          defaultValue={formatDateForInput(editingBooking.check_out_date)} 
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

                      <div>
                        <Label htmlFor="room_price" className="mb-2 block">Room Price</Label>
                        <Input name="room_price" type="number" step="0.01" defaultValue={editingBooking.room_price} />
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
                        <Label htmlFor="airport_transfer_price" className="mb-2 block">Airport Transfer Price</Label>
                        <Input name="airport_transfer_price" type="number" step="0.01" defaultValue={editingBooking.airport_transfer_price} />
                      </div>

                      <div>
                        <Label htmlFor="circuit_transfer_quantity" className="mb-2 block">Circuit Transfer Quantity</Label>
                        <Input name="circuit_transfer_quantity" type="number" defaultValue={editingBooking.circuit_transfer_quantity} />
                      </div>

                      <div>
                        <Label htmlFor="circuit_transfer_price" className="mb-2 block">Circuit Transfer Price</Label>
                        <Input name="circuit_transfer_price" type="number" step="0.01" defaultValue={editingBooking.circuit_transfer_price} />
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg mb-4">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payment_currency" className="mb-2 block">Payment Currency</Label>
                        <Select name="payment_currency" defaultValue={editingBooking.payment_currency}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="payment_1" className="mb-2 block">Payment 1 Amount</Label>
                        <Input name="payment_1" type="number" step="0.01" defaultValue={editingBooking.payment_1} />
                      </div>

                      <div>
                        <Label htmlFor="payment_1_date" className="mb-2 block">Payment 1 Date</Label>
                        <Input 
                          name="payment_1_date" 
                          type="date" 
                          defaultValue={formatDateForInput(editingBooking.payment_1_date)} 
                        />
                      </div>

                      <div>
                        <Label htmlFor="payment_1_status" className="mb-2 block">Payment 1 Status</Label>
                        <Select name="payment_1_status" defaultValue={editingBooking.payment_1_status}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Due">Due</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="payment_2" className="mb-2 block">Payment 2 Amount</Label>
                        <Input name="payment_2" type="number" step="0.01" defaultValue={editingBooking.payment_2} />
                      </div>

                      <div>
                        <Label htmlFor="payment_2_date" className="mb-2 block">Payment 2 Date</Label>
                        <Input 
                          name="payment_2_date" 
                          type="date" 
                          defaultValue={formatDateForInput(editingBooking.payment_2_date)} 
                        />
                      </div>

                      <div>
                        <Label htmlFor="payment_2_status" className="mb-2 block">Payment 2 Status</Label>
                        <Select name="payment_2_status" defaultValue={editingBooking.payment_2_status}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Due">Due</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="payment_3" className="mb-2 block">Payment 3 Amount</Label>
                        <Input name="payment_3" type="number" step="0.01" defaultValue={editingBooking.payment_3} />
                      </div>

                      <div>
                        <Label htmlFor="payment_3_date" className="mb-2 block">Payment 3 Date</Label>
                        <Input 
                          name="payment_3_date" 
                          type="date" 
                          defaultValue={formatDateForInput(editingBooking.payment_3_date)} 
                        />
                      </div>

                      <div>
                        <Label htmlFor="payment_3_status" className="mb-2 block">Payment 3 Status</Label>
                        <Select name="payment_3_status" defaultValue={editingBooking.payment_3_status}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Due">Due</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
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

export { BookingsTable };
