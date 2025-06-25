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
import { Plus, Trash2, Search, Filter, Pencil, Loader2, CheckCircle2, X, ChevronsUpDown, Plane, RefreshCw } from "lucide-react";
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
import { Link } from "react-router-dom";

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
  const [loadingFlightInfo, setLoadingFlightInfo] = useState(false);
  const [showFlightInfoDialog, setShowFlightInfoDialog] = useState(false);
  const [selectedFlightForInfo, setSelectedFlightForInfo] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    airline: "all",
    eventName: "all",
    class: "all",
  });

  // Form state
  const initialFlightState = {
    flight_id: "",
    outbound_airport: "",
    inbound_airport: "",
    outbound_departure_date_time: "",
    outbound_arrival_date_time: "",
    outbound_flight_number: "",
    inbound_departure_date_time: "",
    inbound_arrival_date_time: "",
    inbound_flight_number: "",
    outbound_layover_time: "",
    inbound_layover_time: "",
    airline: "",
    class: "Economy",
    from_location: "",
    cost: 0,
    margin: "10%",
    currency: "GBP",
    source: ""
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
        api.get("test-flights"),
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (isEditDialogOpen) {
        await handleEditFlight(formData);
      } else {
        await handleAddFlight(formData);
      }
      
      // Close dialog and reset form
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setFormData(initialFlightState);
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Failed to save flight');
    }
  };

  const handleAddFlight = async (flightData) => {
    try {
      setIsAdding(true);
      await api.post("stock-flights", flightData);
      setSuccessMessage("Flight added successfully!");
      setIsAddDialogOpen(false);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to add flight:", error);
      toast.error("Failed to add flight");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditFlight = async (flightData) => {
    try {
      setIsEditing(true);
      await api.put(`stock-flights/flight_id/${editingFlight.flight_id}`, flightData);
      setSuccessMessage("Flight updated successfully!");
      setIsEditDialogOpen(false);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update flight:", error);
      toast.error("Failed to update flight");
    } finally {
      setIsEditing(false);
    }
  };

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
      flight_id: flight.flight_id,
      outbound_airport: flight.outbound_airport,
      inbound_airport: flight.inbound_airport,
      outbound_departure_date_time: flight.outbound_departire_date_time,
      outbound_arrival_date_time: flight.outbound_arrival_date_time,
      outbound_flight_number: flight.outbound_flight_number,
      inbound_departure_date_time: flight.inbound_departure_date_time,
      inbound_arrival_date_time: flight.inbound_arrival_date_time,
      inbound_flight_number: flight.inbound_flight_number,
      outbound_layover_time: flight.outbound_layover_time,
      inbound_layover_time: flight.inbound_layover_time,
      airline: flight.airline,
      class: flight.class,
      from_location: flight.from_location,
      cost: flight.cost,
      margin: flight.margin,
      currency: flight.currency,
      source: flight.source
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
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Flight
          </Button>
          <Link to="/flight">
            <Button variant="outline" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Add Flight from Aviate/Line
            </Button>
          </Link>
        </div>
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
              <TableHead colSpan={2} className="bg-muted/50 text-sm font-semibold">
                Outbound Flight
              </TableHead>
              <TableHead colSpan={2} className="bg-muted/50 text-sm font-semibold">
                Return Flight
              </TableHead>
              <TableHead colSpan={5} className="bg-muted/50 text-sm font-semibold">
                Information
              </TableHead>
              <TableHead className="bg-muted/50 text-sm font-semibold">
                Actions
              </TableHead>
            </TableRow>
            <TableRow className="text-xs">
              <TableHead>Flight</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Flight</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Airline</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>Source</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {currentItems.map((item) => (
              <TableRow key={item.flight_id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.outbound_flight_number}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{item.outbound_airport}</span>
                      <span className="text-muted-foreground text-[10px]">{item.outbound_departure_date_time}</span>
                    </div>
                    <div className="relative flex-1 flex flex-col items-center justify-center min-w-[120px] py-4">
                      <div className="flex items-center w-full">
                        <div className="flex-1" style={{ 
                          borderTop: '1px dashed rgb(0 0 0 / 0.2)',
                          backgroundSize: '8px 1px',
                          height: '1px'
                        }}></div>
                        <div className="px-2">
                          <Plane className="h-3 w-3 rotate-90 text-muted-foreground" />
                        </div>
                        <div className="flex-1" style={{ 
                          borderTop: '1px dashed rgb(0 0 0 / 0.2)',
                          backgroundSize: '8px 1px',
                          height: '1px'
                        }}></div>
                      </div>
                      {item.outbound_layover_time > 0 && (
                        <span className="text-[10px] text-muted-foreground absolute bottom-0">
                          {item.outbound_layover_time}h layover
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{item.inbound_airport}</span>
                      <span className="text-muted-foreground text-[10px]">{item.outbound_arrival_date_time}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.inbound_flight_number}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{item.inbound_airport}</span>
                      <span className="text-muted-foreground text-[10px]">{item.inbound_departure_date_time}</span>
                    </div>
                    <div className="relative flex-1 flex flex-col items-center justify-center min-w-[120px] py-4">
                      <div className="flex items-center w-full">
                        <div className="flex-1" style={{ 
                          borderTop: '1px dashed rgb(0 0 0 / 0.2)',
                          backgroundSize: '8px 1px',
                          height: '1px'
                        }}></div>
                        <div className="px-2">
                          <Plane className="h-3 w-3 -rotate-90 text-muted-foreground" />
                        </div>
                        <div className="flex-1" style={{ 
                          borderTop: '1px dashed rgb(0 0 0 / 0.2)',
                          backgroundSize: '8px 1px',
                          height: '1px'
                        }}></div>
                      </div>
                      {item.inbound_layover_time > 0 && (
                        <span className="text-[10px] text-muted-foreground absolute bottom-0">
                          {item.inbound_layover_time}h layover
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{item.outbound_airport}</span>
                      <span className="text-muted-foreground text-[10px]">{item.inbound_arrival_date_time}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.airline}</TableCell>
                <TableCell>{item.class}</TableCell>
                <TableCell>£{item.cost}</TableCell>
                <TableCell>{item.margin}</TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(item)}
                      disabled={isDeleting}
                    >
                      {isDeleting && flightToDelete?.flight_id === item.flight_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-destructive" />
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

      {/* Add/Edit Flight Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setFormData(initialFlightState);
          setErrors({});
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit Flight' : 'Add New Flight'}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? 'Update the flight details below.' : 'Fill in the flight details below to add a new flight.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Flight Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Flight Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outbound_airport">From</Label>
                  <Input
                    id="outbound_airport"
                    value={formData.outbound_airport}
                    onChange={(e) => handleFieldChange('outbound_airport', e.target.value.toUpperCase())}
                    onBlur={(e) => handleBlur('outbound_airport', e.target.value)}
                    placeholder="e.g., LHR"
                    className={errors.outbound_airport ? 'border-red-500' : ''}
                  />
                  {errors.outbound_airport && (
                    <p className="text-sm text-red-500">{errors.outbound_airport}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inbound_airport">To</Label>
                  <Input
                    id="inbound_airport"
                    value={formData.inbound_airport}
                    onChange={(e) => handleFieldChange('inbound_airport', e.target.value.toUpperCase())}
                    onBlur={(e) => handleBlur('inbound_airport', e.target.value)}
                    placeholder="e.g., JFK"
                    className={errors.inbound_airport ? 'border-red-500' : ''}
                  />
                  {errors.inbound_airport && (
                    <p className="text-sm text-red-500">{errors.inbound_airport}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="airline">Airline</Label>
                  <Input
                    id="airline"
                    value={formData.airline}
                    onChange={(e) => handleFieldChange('airline', e.target.value)}
                    onBlur={(e) => handleBlur('airline', e.target.value)}
                    placeholder="e.g., British Airways"
                    className={errors.airline ? 'border-red-500' : ''}
                  />
                  {errors.airline && (
                    <p className="text-sm text-red-500">{errors.airline}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Cabin Class</Label>
                  <Select
                    value={formData.class}
                    onValueChange={(value) => handleFieldChange('class', value)}
                  >
                    <SelectTrigger className={errors.class ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select cabin class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Economy">Economy</SelectItem>
                      <SelectItem value="Premium Economy">Premium Economy</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="First">First</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.class && (
                    <p className="text-sm text-red-500">{errors.class}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Outbound Flight Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Outbound Flight</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outbound_flight_number">Flight Number</Label>
                  <Input
                    id="outbound_flight_number"
                    value={formData.outbound_flight_number}
                    onChange={(e) => handleFieldChange('outbound_flight_number', e.target.value)}
                    onBlur={(e) => handleBlur('outbound_flight_number', e.target.value)}
                    placeholder="e.g., BA123"
                    className={errors.outbound_flight_number ? 'border-red-500' : ''}
                  />
                  {errors.outbound_flight_number && (
                    <p className="text-sm text-red-500">{errors.outbound_flight_number}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outbound_departure_date_time">Departure Date & Time</Label>
                  <Input
                    id="outbound_departure_date_time"
                    type="datetime-local"
                    value={formData.outbound_departure_date_time}
                    onChange={(e) => handleFieldChange('outbound_departure_date_time', e.target.value)}
                    onBlur={(e) => handleBlur('outbound_departure_date_time', e.target.value)}
                    className={errors.outbound_departure_date_time ? 'border-red-500' : ''}
                  />
                  {errors.outbound_departure_date_time && (
                    <p className="text-sm text-red-500">{errors.outbound_departure_date_time}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outbound_arrival_date_time">Arrival Date & Time</Label>
                  <Input
                    id="outbound_arrival_date_time"
                    type="datetime-local"
                    value={formData.outbound_arrival_date_time}
                    onChange={(e) => handleFieldChange('outbound_arrival_date_time', e.target.value)}
                    onBlur={(e) => handleBlur('outbound_arrival_date_time', e.target.value)}
                    className={errors.outbound_arrival_date_time ? 'border-red-500' : ''}
                  />
                  {errors.outbound_arrival_date_time && (
                    <p className="text-sm text-red-500">{errors.outbound_arrival_date_time}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Inbound Flight Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Inbound Flight</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inbound_flight_number">Flight Number</Label>
                  <Input
                    id="inbound_flight_number"
                    value={formData.inbound_flight_number}
                    onChange={(e) => handleFieldChange('inbound_flight_number', e.target.value)}
                    onBlur={(e) => handleBlur('inbound_flight_number', e.target.value)}
                    placeholder="e.g., BA124"
                    className={errors.inbound_flight_number ? 'border-red-500' : ''}
                  />
                  {errors.inbound_flight_number && (
                    <p className="text-sm text-red-500">{errors.inbound_flight_number}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inbound_departure_date_time">Departure Date & Time</Label>
                  <Input
                    id="inbound_departure_date_time"
                    type="datetime-local"
                    value={formData.inbound_departure_date_time}
                    onChange={(e) => handleFieldChange('inbound_departure_date_time', e.target.value)}
                    onBlur={(e) => handleBlur('inbound_departure_date_time', e.target.value)}
                    className={errors.inbound_departure_date_time ? 'border-red-500' : ''}
                  />
                  {errors.inbound_departure_date_time && (
                    <p className="text-sm text-red-500">{errors.inbound_departure_date_time}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inbound_arrival_date_time">Arrival Date & Time</Label>
                  <Input
                    id="inbound_arrival_date_time"
                    type="datetime-local"
                    value={formData.inbound_arrival_date_time}
                    onChange={(e) => handleFieldChange('inbound_arrival_date_time', e.target.value)}
                    onBlur={(e) => handleBlur('inbound_arrival_date_time', e.target.value)}
                    className={errors.inbound_arrival_date_time ? 'border-red-500' : ''}
                  />
                  {errors.inbound_arrival_date_time && (
                    <p className="text-sm text-red-500">{errors.inbound_arrival_date_time}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleFieldChange('cost', e.target.value)}
                    onBlur={(e) => handleBlur('cost', e.target.value)}
                    placeholder="0.00"
                    className={errors.cost ? 'border-red-500' : ''}
                  />
                  {errors.cost && (
                    <p className="text-sm text-red-500">{errors.cost}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleFieldChange('currency', value)}
                  >
                    <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.currency && (
                    <p className="text-sm text-red-500">{errors.currency}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="margin">Margin</Label>
                  <Input
                    id="margin"
                    value={formData.margin}
                    onChange={(e) => handleFieldChange('margin', e.target.value)}
                    onBlur={(e) => handleBlur('margin', e.target.value)}
                    placeholder="e.g., 10%"
                    className={errors.margin ? 'border-red-500' : ''}
                  />
                  {errors.margin && (
                    <p className="text-sm text-red-500">{errors.margin}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => handleFieldChange('source', e.target.value)}
                    onBlur={(e) => handleBlur('source', e.target.value)}
                    placeholder="e.g., Flight API"
                    className={errors.source ? 'border-red-500' : ''}
                  />
                  {errors.source && (
                    <p className="text-sm text-red-500">{errors.source}</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setFormData(initialFlightState);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAdding || isEditing}>
                {isAdding || isEditing ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {isEditDialogOpen ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  isEditDialogOpen ? 'Update Flight' : 'Add Flight'
                )}
              </Button>
            </DialogFooter>
          </form>
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
