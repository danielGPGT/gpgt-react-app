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
import { Plus, Trash2, Search, Filter, Pencil, Loader2, CheckCircle2, X } from "lucide-react";
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
  const [editingRow, setEditingRow] = useState(null);
  const [inlineEditData, setInlineEditData] = useState(null);

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
        api.get("stock - flights"),
        api.get("event"),
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
    validateField(field, value);
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
        // Update each field individually
        const updates = Object.entries(flightData).map(async ([column, value]) => {
          if (value !== editingFlight[column]) {
            // Map frontend column names to sheet column names
            const columnMap = {
              'event_name': 'Event Name',
              'airline': 'Airline',
              'class': 'Class',
              'outbound_flight': 'Outbound Flight',
              'inbound_flight': 'Inbound Flight',
              'from_location': 'From Location',
              'cost': 'Cost',
              'margin': 'Margin',
              'currency': 'Currency',
              'source': 'Source',
              'used': 'Used'
            };
            
            const sheetColumn = columnMap[column];
            if (sheetColumn) {
              await api.put(`stock - flights/Flight ID/${editingFlight.flight_id}`, {
                column: sheetColumn,
                value: value
              });
            }
          }
        });
        
        await Promise.all(updates);
        setSuccessMessage("Flight updated successfully!");
      } else {
        setIsAdding(true);
        await api.post("stock - flights", flightData);
        setSuccessMessage("Flight added successfully!");
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
      await api.delete(`stock - flights/Flight ID/${flightId}`);
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

  const handleInlineEdit = (flight) => {
    setEditingRow(flight.flight_id);
    setInlineEditData({
      ...flight,
      event_name: flight.event_name
    });
  };

  const handleInlineSave = async () => {
    try {
      setIsEditing(true);
      // Update each changed field individually
      const updates = Object.entries(inlineEditData).map(async ([column, value]) => {
        const originalValue = flights.find(f => f.flight_id === editingRow)[column];
        if (value !== originalValue) {
          console.log('Updating column:', column, 'from:', originalValue, 'to:', value);
          // Map frontend column names to sheet column names
          const columnMap = {
            'event_name': 'Event Name',
            'airline': 'Airline',
            'class': 'Class',
            'outbound_flight': 'Outbound Flight',
            'inbound_flight': 'Inbound Flight',
            'from_location': 'From Location',
            'cost': 'Cost',
            'margin': 'Margin',
            'currency': 'Currency',
            'source': 'Source',
            'used': 'Used'
          };
          
          const sheetColumn = columnMap[column];
          if (sheetColumn) {
            await api.put(`stock - flights/Flight ID/${editingRow}`, {
              column: sheetColumn,
              value: value
            });
          }
        }
      });
      
      await Promise.all(updates);
      toast.success("Flight updated successfully");
      setEditingRow(null);
      setInlineEditData(null);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update flight:", error);
      toast.error("Failed to update flight");
    } finally {
      setIsEditing(false);
    }
  };

  const handleInlineCancel = () => {
    setEditingRow(null);
    setInlineEditData(null);
  };

  const handleInlineChange = (field, value) => {
    setInlineEditData(prev => ({
      ...prev,
      [field]: value
    }));
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
                  {editingRow === item.flight_id ? (
                    <Select
                      value={inlineEditData.event_name}
                      onValueChange={(value) => {
                        handleInlineChange('event_name', value);
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.event_id} value={event.event}>
                            {event.event}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    item.event_name
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === item.flight_id ? (
                    <Input
                      value={inlineEditData.airline}
                      onChange={(e) => handleInlineChange('airline', e.target.value)}
                      className="w-[150px]"
                    />
                  ) : (
                    item.airline
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === item.flight_id ? (
                    <Select
                      value={inlineEditData.class}
                      onValueChange={(value) => handleInlineChange('class', value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Economy">Economy</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="First">First</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    item.class
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === item.flight_id ? (
                    <Input
                      value={inlineEditData.outbound_flight}
                      onChange={(e) => handleInlineChange('outbound_flight', e.target.value)}
                      className="w-[150px]"
                    />
                  ) : (
                    item.outbound_flight
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === item.flight_id ? (
                    <Input
                      value={inlineEditData.inbound_flight}
                      onChange={(e) => handleInlineChange('inbound_flight', e.target.value)}
                      className="w-[150px]"
                    />
                  ) : (
                    item.inbound_flight
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === item.flight_id ? (
                    <Input
                      value={inlineEditData.from_location}
                      onChange={(e) => handleInlineChange('from_location', e.target.value)}
                      className="w-[120px]"
                    />
                  ) : (
                    item.from_location
                  )}
                </TableCell>
                <TableCell>
                  {editingRow === item.flight_id ? (
                    <Input
                      type="number"
                      value={inlineEditData.cost}
                      onChange={(e) => handleInlineChange('cost', parseFloat(e.target.value))}
                      className="w-[100px]"
                    />
                  ) : (
                    `£ ${item.cost}`
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingRow === item.flight_id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleInlineSave}
                          disabled={isEditing}
                        >
                          {isEditing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleInlineCancel}
                          disabled={isEditing}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleInlineEdit(item)}
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
                      </>
                    )}
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
        <DialogContent className="sm:max-w-[600px]">
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">Event</Label>
                <Select
                  value={formData.event_name}
                  onValueChange={(value) => {
                    handleFieldChange('event_name', value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.event_id} value={event.event}>
                        {event.event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Input
                  id="outbound_flight"
                  value={formData.outbound_flight}
                  onChange={(e) => handleFieldChange('outbound_flight', e.target.value)}
                  onBlur={(e) => handleBlur('outbound_flight', e.target.value)}
                  placeholder="Enter outbound flight details"
                />
                {errors.outbound_flight && (
                  <p className="text-sm text-red-500">{errors.outbound_flight}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inbound_flight">Inbound Flight</Label>
                <Input
                  id="inbound_flight"
                  value={formData.inbound_flight}
                  onChange={(e) => handleFieldChange('inbound_flight', e.target.value)}
                  onBlur={(e) => handleBlur('inbound_flight', e.target.value)}
                  placeholder="Enter inbound flight details"
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
