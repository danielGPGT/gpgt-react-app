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
import { CheckCircle2, XCircle, Plus, Trash2, Search, Filter, Pencil, Eye } from "lucide-react";
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
    return [...new Set(bookings.map(booking => booking[field]).filter(Boolean))];
  };

  // Filter functions
  const filterBookings = (items) => {
    return items.filter(item => {
      const searchMatch = filters.search === "" || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      const statusMatch = filters.status === "all" || item.status === filters.status;
      const eventMatch = filters.event === "all" || item.event_name === filters.event;
      const packageMatch = filters.package === "all" || item.package_type === filters.package;
      const bookingTypeMatch = filters.bookingType === "all" || item.booking_type === filters.bookingType;
      const consultantMatch = filters.consultant === "all" || item.consultant === filters.consultant;
      // Date range filter using DatePickerWithRange
      let dateMatch = true;
      if (filters.bookingDateRange.from) {
        dateMatch = dateMatch && new Date(item.booking_date) >= new Date(filters.bookingDateRange.from);
      }
      if (filters.bookingDateRange.to) {
        dateMatch = dateMatch && new Date(item.booking_date) <= new Date(filters.bookingDateRange.to);
      }

      return searchMatch && statusMatch && eventMatch && packageMatch && bookingTypeMatch && consultantMatch && dateMatch;
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
      setBookings(prevBookings => prevBookings.filter(booking => booking.booking_ref !== bookingToDelete));
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

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading bookings...</div>;
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bookings</h3>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
            {getUniqueValues('status').map((status) => (
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
            {getUniqueValues('event_name').map((event) => (
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
            {getUniqueValues('package_type').map((pkg) => (
              <SelectItem key={pkg} value={pkg}>
                {pkg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.consultant}
          onValueChange={(value) => setFilters({ ...filters, consultant: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Consultant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Consultants</SelectItem>
            {getUniqueValues('consultant').map((consultant) => (
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
            setDate={range => setFilters({ ...filters, bookingDateRange: range })}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ ...filters, bookingDateRange: { from: null, to: null } })}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((booking) => (
              <TableRow key={booking.booking_ref}>
                <TableCell className="font-medium">{booking.booking_ref}</TableCell>
                <TableCell>
                  <Badge variant={booking.status === "Future" ? "default" : "secondary"}>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell>{booking.event_name}</TableCell>
                <TableCell>{booking.package_type}</TableCell>
                <TableCell>{booking.booker_name}</TableCell>
                <TableCell>{booking.booking_date}</TableCell>
                <TableCell>
                  £ {booking.total_cost.toLocaleString()}
                </TableCell>
                <TableCell>
                  £ {booking.total_sold_gbp.toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={booking["p&l"] >= 0 ? "text-green-500" : "text-red-500"}>
                    £ {booking["p&l"].toLocaleString()}
                  </span>
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
                      onClick={() => handleDeleteBooking(booking.booking_ref)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} items
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
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
              Are you sure you want to delete this booking? This action cannot be undone.
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
            <AlertDialogTitle className="text-green-600">Success</AlertDialogTitle>
            <AlertDialogDescription>
              {successMessage}
            </AlertDialogDescription>
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
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={viewingBooking.status === "New" ? "default" : "secondary"} className="ml-2">
                        {viewingBooking.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booking Type:</span>
                      <span className="ml-2">{viewingBooking.booking_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Consultant:</span>
                      <span className="ml-2">{viewingBooking.consultant}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Acquisition:</span>
                      <span className="ml-2">{viewingBooking.acquisition}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ATOL/ABTOT:</span>
                      <span className="ml-2">{viewingBooking.atol_abtot}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booking Date:</span>
                      <span className="ml-2">{viewingBooking.booking_date}</span>
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
                      <span className="text-muted-foreground">Package Type:</span>
                      <span className="ml-2">{viewingBooking.package_type}</span>
                    </div>
                  </div>
                </div>

                {/* Booker Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Booker Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2">{viewingBooking.booker_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{viewingBooking.booker_email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2">{viewingBooking.booker_phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Address:</span>
                      <pre className="ml-2 whitespace-pre-wrap">{viewingBooking.booker_address}</pre>
                    </div>
                  </div>
                </div>

                {/* Lead Traveller Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Lead Traveller Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-2">{viewingBooking.lead_traveller_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{viewingBooking.lead_traveller_email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2">{viewingBooking.lead_traveller_phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adults:</span>
                      <span className="ml-2">{viewingBooking.adults}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Guest Travellers:</span>
                      <span className="ml-2">{viewingBooking.guest_traveller_names}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Ticket Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Ticket Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Ticket Name:</span>
                      <span className="ml-2">{viewingBooking.ticket_name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">{viewingBooking.ticket_quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">£{viewingBooking.ticket_cost || "0"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">£{viewingBooking.ticket_price}</span>
                    </div>
                  </div>
                </div>

                {/* Hotel Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Hotel Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Hotel:</span>
                      <span className="ml-2">{viewingBooking.hotel_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Room Category:</span>
                      <span className="ml-2">{viewingBooking.room_category}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Room Type:</span>
                      <span className="ml-2">{viewingBooking.room_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check In:</span>
                      <span className="ml-2">{viewingBooking.check_in_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check Out:</span>
                      <span className="ml-2">{viewingBooking.check_out_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nights:</span>
                      <span className="ml-2">{viewingBooking.nights}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Extra Nights:</span>
                      <span className="ml-2">{viewingBooking.extra_nights}</span>
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
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Transfer Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Airport Transfer:</span>
                      <span className="ml-2">{viewingBooking.airport_transfer_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">{viewingBooking.airport_transfer_quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">£{viewingBooking.airport_transfer_cost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">£{viewingBooking.airport_transfer_price}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Circuit Transfer:</span>
                      <span className="ml-2">{viewingBooking.circuit_transfer_type || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">{viewingBooking.circuit_transfer_quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Flight Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Flight Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Outbound:</span>
                      <span className="ml-2">{viewingBooking.flight_outbound}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inbound:</span>
                      <span className="ml-2">{viewingBooking.flight_inbound}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <span className="ml-2">{viewingBooking.flight_class}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carrier:</span>
                      <span className="ml-2">{viewingBooking.flight_carrier}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <span className="ml-2">{viewingBooking.flight_source}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booking Reference:</span>
                      <span className="ml-2">{viewingBooking.flight_booking_reference}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ticketing Deadline:</span>
                      <span className="ml-2">{viewingBooking.ticketing_deadline}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2">{viewingBooking.flight_status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">{viewingBooking.flight_quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">£{viewingBooking.flight_cost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">£{viewingBooking.flight_price}</span>
                    </div>
                  </div>
                </div>

                {/* Lounge Pass Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Lounge Pass Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Variant:</span>
                      <span className="ml-2">{viewingBooking.lounge_pass_variant}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2">{viewingBooking.lounge_pass_quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="ml-2">£{viewingBooking.lounge_pass_cost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2">£{viewingBooking.lounge_pass_price}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="ml-2">{viewingBooking.payment_currency}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="ml-2">£ {viewingBooking.total_cost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Sold (Local):</span>
                      <span className="ml-2">{viewingBooking.payment_currency} {viewingBooking.total_sold_for_local}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Sold (GBP):</span>
                      <span className="ml-2">£ {viewingBooking.total_sold_gbp}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">P&L:</span>
                      <span className={`ml-2 ${viewingBooking["p&l"] >= 0 ? "text-green-500" : "text-red-500"}`}>
                        £ {viewingBooking["p&l"]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="font-medium mb-1">Payment Schedule</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Payment 1:</span>
                        <span className="ml-2">{viewingBooking.payment_currency} {viewingBooking.payment_1} due {viewingBooking.payment_1_date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment 2:</span>
                        <span className="ml-2">{viewingBooking.payment_currency} {viewingBooking.payment_2} due {viewingBooking.payment_2_date}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payment 3:</span>
                        <span className="ml-2">{viewingBooking.payment_currency} {viewingBooking.payment_3} due {viewingBooking.payment_3_date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { BookingsTable };
