import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Search, Filter, Pencil, Loader2, CheckCircle2, X, ChevronsUpDown } from "lucide-react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

function FlightsTable() {
  // State declarations
  const [flights, setFlights] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [itemsPerPage] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    airline: "all",
    eventName: "all",
    class: "all",
  });

  // Form state
  const initialFlightState = {
    event_id: "",
    event_name: "",
    flight_id: "",
    outbound_flight: "",
    inbound_flight: "",
    airline: "",
    class: "Economy",
    from_location: "",
    cost: 0,
    margin: "10%",
    currency: "GBP",
    source: "",
    used: 0
  };

  const [formData, setFormData] = useState(initialFlightState);
  const [errors, setErrors] = useState({});

  // Add flight formatting helper function
  const formatFlightDetails = (date, airport, time, destination, returnDate, flightNumber) => {
    return `${date} ${airport} ${time} ${destination} ${returnDate} (${flightNumber})`;
  };

  const parseFlightDetails = (flightString) => {
    // Main format: "DD/MM/YY XXX HHMM:HHMM XXX DD/MM/YY" with optional flight number and layover times
    const match = flightString.match(/^(\d{2}\/\d{2}\/\d{2})\s+(\w+)\s+(\d{4}:\d{4})\s+(\w+)\s+(\d{2}\/\d{2}\/\d{2})(?:\s+\(([^)]+)\))?$/);
    if (match) {
      return {
        date: match[1],
        airport: match[2],
        time: match[3],
        destination: match[4],
        returnDate: match[5],
        flightNumber: match[6] || '' // Optional flight number
      };
    }
    return null;
  };

  // Helper functions
  const getUniqueAirlines = useCallback(() => {
    const uniqueAirlines = [...new Set(flights.map((item) => item.airline))];
    return uniqueAirlines.filter((airline) => airline).sort();
  }, [flights]);

  const getUniqueClasses = useCallback(() => {
    const uniqueClasses = [...new Set(flights.map((item) => item.class))];
    return uniqueClasses.filter((cls) => cls).sort();
  }, [flights]);

  const getUniqueEventNames = useCallback(() => {
    const uniqueEvents = [...new Set(flights.map((item) => item.event_name))];
    return uniqueEvents.filter((event) => event).sort();
  }, [flights]);

  // Memoize options
  const airlineOptions = useMemo(() => getUniqueAirlines(), [getUniqueAirlines]);
  const classOptions = useMemo(() => getUniqueClasses(), [getUniqueClasses]);
  const flightEventOptions = useMemo(() => getUniqueEventNames(), [getUniqueEventNames]);

  const fetchInitialData = async () => {
    try {
      const [flightsRes, eventsRes] = await Promise.all([
        api.get("stock-flights"),
        api.get("events"),
      ]);

      const validFlights = Array.isArray(flightsRes.data) ? flightsRes.data : [];
      const validEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];

      console.log('Events data:', validEvents);
      setFlights(validFlights);
      setEvents(validEvents);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      setFlights([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'event_name':
        if (!value || value.trim() === '') {
          newErrors[field] = 'Event name is required';
        } else {
          delete newErrors[field];
        }
        break;
      case 'airline':
        if (!value || value.trim() === '') {
          newErrors[field] = 'Airline is required';
        } else {
          delete newErrors[field];
        }
        break;
      case 'outbound_flight':
        if (!value || value.trim() === '') {
          newErrors[field] = 'Outbound flight is required';
        } else {
          delete newErrors[field];
        }
        break;
      case 'inbound_flight':
        if (!value || value.trim() === '') {
          newErrors[field] = 'Inbound flight is required';
        } else {
          delete newErrors[field];
        }
        break;
      case 'cost':
        if (!value || isNaN(value) || value <= 0) {
          newErrors[field] = 'Cost must be a positive number';
        } else {
          delete newErrors[field];
        }
        break;
      default:
        delete newErrors[field];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    if (validateField(field, value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBlur = (field, value) => {
    if (field === 'outbound_flight' || field === 'inbound_flight') {
      // Only validate the main flight details format
      if (value && !parseFlightDetails(value)) {
        setErrors(prev => ({
          ...prev,
          [field]: 'Invalid flight format. Required format: DD/MM/YY XXX HHMM:HHMM XXX DD/MM/YY (flight number optional)'
        }));
        return;
      }
    }
    validateField(field, value);
  };

  const handleInlineBlur = (field, value) => {
    if (field === 'outbound_flight' || field === 'inbound_flight') {
      // Only validate the main flight details format
      if (value && !parseFlightDetails(value)) {
        toast.error('Invalid flight format. Required format: DD/MM/YY XXX HHMM:HHMM XXX DD/MM/YY (flight number optional)');
      }
    }
  };

  const handleSubmitForm = useCallback(async (e, isEdit, editingFlight) => {
    e.preventDefault();
    try {
      const flightData = {
        ...formData,
        flight_id: isEdit ? editingFlight.flight_id : crypto.randomUUID()
      };

      if (isEdit) {
        setIsEditing(true);
        // Send the entire updated flight data
        await api.put(`stock-flights/flight_id/${editingFlight.flight_id}`, flightData);
        setSuccessMessage("Flight updated successfully!");
        setIsEditDialogOpen(false);
      } else {
        setIsAdding(true);
        await api.post("stock-flights", flightData);
        setSuccessMessage("Flight added successfully!");
        setIsAddDialogOpen(false);
      }

      setShowSuccessDialog(true);
      setFormData(initialFlightState);
      setErrors({});
      setEditingFlight(null);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to save flight:", error);
      toast.error("Failed to save flight");
    } finally {
      setIsAdding(false);
      setIsEditing(false);
    }
  }, [formData, fetchInitialData]);

  const handleDeleteFlight = async (flightId) => {
    try {
      setIsDeleting(true);
      await api.delete(`stock-flights/flight_id/${flightId}`);
      toast.success("Flight deleted successfully");
      fetchInitialData();
    } catch (error) {
      console.error("Failed to delete flight:", error);
      toast.error("Failed to delete flight");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (flight) => {
    setFlightToDelete(flight);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (flightToDelete) {
      await handleDeleteFlight(flightToDelete.flight_id);
      setShowDeleteDialog(false);
      setFlightToDelete(null);
    }
  };

  const openEditDialog = (flight) => {
    setEditingFlight(flight);
    setFormData({
      event_id: flight.event_id,
      event_name: flight.event_name,
      flight_id: flight.flight_id,
      outbound_flight: flight.outbound_flight,
      inbound_flight: flight.inbound_flight,
      airline: flight.airline,
      class: flight.class,
      from_location: flight.from_location,
      cost: flight.cost,
      margin: flight.margin,
      currency: flight.currency,
      source: flight.source,
      used: flight.used
    });
    setIsEditDialogOpen(true);
  };

  // Filter functions
  const filterFlights = (items) => {
    return items.filter((item) => {
      const searchMatch =
        filters.search === "" ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      const airlineMatch =
        filters.airline === "all" || item.airline === filters.airline;
      const classMatch =
        filters.class === "all" || item.class === filters.class;
      const eventNameMatch =
        filters.eventName === "all" ||
        item.event_name === filters.eventName;

      return searchMatch && airlineMatch && classMatch && eventNameMatch;
    });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Apply filters and calculate pagination
  const filteredFlights = filterFlights(flights);
  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredFlights.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">Loading flights...</div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Flights & Transport</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Flight
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flights..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={filters.airline}
          onValueChange={(value) => setFilters({ ...filters, airline: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Airline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Airlines</SelectItem>
            {airlineOptions.map((airline) => (
              <SelectItem key={airline} value={airline}>
                {airline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.class}
          onValueChange={(value) => setFilters({ ...filters, class: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classOptions.map((cls) => (
              <SelectItem key={cls} value={cls}>
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.eventName}
          onValueChange={(value) => setFilters({ ...filters, eventName: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {flightEventOptions.map((eventName) => (
              <SelectItem key={eventName} value={eventName}>
                {eventName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Airline</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Outbound Flight</TableHead>
              <TableHead>Inbound Flight</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Cost (pp)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.flight_id}>
                <TableCell className="font-medium">
                  {item.event_name}
                </TableCell>
                <TableCell>
                  {item.airline}
                </TableCell>
                <TableCell>
                  {item.class}
                </TableCell>
                <TableCell>
                  {item.outbound_flight}
                </TableCell>
                <TableCell>
                  {item.inbound_flight}
                </TableCell>
                <TableCell>
                  {item.from_location}
                </TableCell>
                <TableCell>
                  £ {item.cost}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(item)}
                      disabled={isDeleting}
                    >
                      {isDeleting && flightToDelete?.flight_id === item.flight_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
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
          {Math.min(endIndex, filteredFlights.length)} of {filteredFlights.length}{" "}
          flights
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingFlight(null);
            setFormData(initialFlightState);
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Flight" : "Add New Flight"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the flight details"
                : "Fill in the details for the new flight"}
            </DialogDescription>
          </DialogHeader>
          {(isAdding || isEditing) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {isEditing ? "Updating flight..." : "Adding flight..."}
                </p>
              </div>
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">Event</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {formData.event_name
                        ? events.find((event) => event.event === formData.event_name)?.event
                        : "Select an event..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search events..." />
                      <CommandEmpty>No event found.</CommandEmpty>
                      <CommandGroup>
                        {events.map((event) => (
                          <CommandItem
                            key={event.event_id}
                            value={event.event}
                            onSelect={(currentValue) => {
                              handleFieldChange('event_name', currentValue);
                              setOpen(false);
                            }}
                          >
                            {event.event}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.event_name && (
                  <p className="text-sm text-red-500">{errors.event_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="airline">Airline</Label>
                <Input
                  id="airline"
                  value={formData.airline}
                  onChange={(e) => handleFieldChange('airline', e.target.value)}
                  onBlur={(e) => handleBlur('airline', e.target.value)}
                  placeholder="Enter airline name"
                />
                {errors.airline && (
                  <p className="text-sm text-red-500">{errors.airline}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outbound_flight">Outbound Flight</Label>
                <p className="text-xs text-muted-foreground mb-1">Format: DD/MM/YY XXX HHMM:HHMM XXX DD/MM/YY (flight number optional)</p>
                <Input
                  id="outbound_flight"
                  value={formData.outbound_flight}
                  onChange={(e) => handleFieldChange('outbound_flight', e.target.value)}
                  onBlur={(e) => handleBlur('outbound_flight', e.target.value)}
                  placeholder="10/04/25 MAD 0930:2050 BAH 10/04/25 (BA123)"
                />
                {errors.outbound_flight && (
                  <p className="text-sm text-red-500">{errors.outbound_flight}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inbound_flight">Inbound Flight</Label>
                <p className="text-xs text-muted-foreground mb-1">Format: DD/MM/YY XXX HHMM:HHMM XXX DD/MM/YY (flight number optional)</p>
                <Input
                  id="inbound_flight"
                  value={formData.inbound_flight}
                  onChange={(e) => handleFieldChange('inbound_flight', e.target.value)}
                  onBlur={(e) => handleBlur('inbound_flight', e.target.value)}
                  placeholder="10/04/25 MAD 0930:2050 BAH 10/04/25 (BA123)"
                />
                {errors.inbound_flight && (
                  <p className="text-sm text-red-500">{errors.inbound_flight}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select
                  value={formData.class}
                  onValueChange={(value) => handleFieldChange('class', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Economy">Economy</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="First">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_location">From Location</Label>
                <Input
                  id="from_location"
                  value={formData.from_location}
                  onChange={(e) => handleFieldChange('from_location', e.target.value)}
                  placeholder="Enter departure location"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value))}
                  onBlur={(e) => handleBlur('cost', parseFloat(e.target.value))}
                  placeholder="Enter cost"
                />
                {errors.cost && (
                  <p className="text-sm text-red-500">{errors.cost}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin">Margin</Label>
                <Input
                  id="margin"
                  value={formData.margin}
                  onChange={(e) => handleFieldChange('margin', e.target.value)}
                  placeholder="Enter margin"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleFieldChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => handleFieldChange('source', e.target.value)}
                  placeholder="Enter source"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingFlight(null);
                setFormData(initialFlightState);
              }}
              disabled={isAdding || isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => handleSubmitForm(e, isEditDialogOpen, editingFlight)}
              disabled={isAdding || isEditing}
            >
              {isAdding || isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditDialogOpen ? "Updating..." : "Adding..."}
                </>
              ) : isEditDialogOpen ? (
                "Update Flight"
              ) : (
                "Add Flight"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Success
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{successMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the flight from {flightToDelete?.from_location} to {flightToDelete?.event_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
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
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { FlightsTable };
