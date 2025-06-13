import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Trash2, Pencil, Loader2, CheckCircle2, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

function EventsTable() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [sportFilter, setSportFilter] = useState("all");
  const [consultantFilter, setConsultantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showCustomSportInput, setShowCustomSportInput] = useState(false);

  // Helper functions
  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.venue_id === venueId);
    return venue ? venue.venue_name : "Unknown Venue";
  };

  const getConsultantName = (consultantId) => {
    const consultant = users.find(u => u.user_id === consultantId);
    return consultant ? `${consultant.first_name} ${consultant.last_name}` : "Unassigned";
  };

  // Add loading states for different operations
  const [isLoading, setIsLoading] = useState({
    initial: true,
    refresh: false,
    add: false,
    edit: false,
    delete: false,
    bulkDelete: false
  });

  // Add these memoized values after the state declarations
  const memoizedFilters = useMemo(() => ({
    sport: sportFilter === "all" ? null : sportFilter.toLowerCase(),
    consultant: consultantFilter === "all" ? null : consultantFilter,
    status: statusFilter === "all" ? null : statusFilter,
    year: yearFilter === "all" ? null : yearFilter,
    search: searchQuery.toLowerCase()
  }), [sportFilter, consultantFilter, statusFilter, yearFilter, searchQuery]);

  // Sorting options
  const sortColumns = [
    { value: "sport", label: "Sport" },
    { value: "event", label: "Event" },
    { value: "event_start_date", label: "Start Date" },
    { value: "event_end_date", label: "End Date" },
    { value: "venue", label: "Venue" },
    { value: "status", label: "status" }
  ];
  const [sortColumn, setSortColumn] = useState("event");
  const [sortDirection, setSortDirection] = useState("asc");

  // Column mapping for API requests
  const columnMap = {
    sport: "sport",
    event: "event",
    event_id: "event_id",
    event_start_date: "event_start_date",
    event_end_date: "event_end_date",
    venue_id: "venue_id",
    consultant_id: "consultant_id",
    status: "status"
  };

  // Enhanced filtered and sorted events
  const filteredEvents = useMemo(() => {
    let result = events.filter((event) => {
      const sportMatch = !memoizedFilters.sport || event.sport.toLowerCase() === memoizedFilters.sport;
      const consultantMatch = !memoizedFilters.consultant || event.consultant_id === memoizedFilters.consultant;
      const statusMatch = !memoizedFilters.status || event.status === memoizedFilters.status;
      const yearMatch = !memoizedFilters.year || new Date(event.event_start_date).getFullYear().toString() === memoizedFilters.year;
      const searchMatch = !memoizedFilters.search || 
        event.event.toLowerCase().includes(memoizedFilters.search) ||
        event.sport.toLowerCase().includes(memoizedFilters.search) ||
        getVenueName(event.venue_id).toLowerCase().includes(memoizedFilters.search) ||
        getConsultantName(event.consultant_id).toLowerCase().includes(memoizedFilters.search);

      return sportMatch && consultantMatch && statusMatch && yearMatch && searchMatch;
    });

    // Enhanced sorting with proper date handling
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // Handle date fields
        if (sortColumn === 'event_start_date' || sortColumn === 'event_end_date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        // Handle venue and consultant names
        else if (sortColumn === 'venue') {
          aVal = getVenueName(a.venue_id).toLowerCase();
          bVal = getVenueName(b.venue_id).toLowerCase();
        }
        else if (sortColumn === 'consultant') {
          aVal = getConsultantName(a.consultant_id).toLowerCase();
          bVal = getConsultantName(b.consultant_id).toLowerCase();
        }
        // Handle other fields
        else {
          aVal = (aVal || "").toString().toLowerCase();
          bVal = (bVal || "").toString().toLowerCase();
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [events, memoizedFilters, sortColumn, sortDirection]);

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredEvents.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      currentItems
    };
  }, [filteredEvents, currentPage, itemsPerPage]);

  // Memoize unique options for filters
  const filterOptions = useMemo(() => ({
    sports: Array.from(new Set(events.map(e => e.sport))).filter(Boolean).sort(),
    consultants: users.filter(user => user.role === "Internal Sales").sort((a, b) => 
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    ),
    years: Array.from(new Set(events.map(e => 
      new Date(e.event_start_date).getFullYear()
    ))).filter(Boolean).sort((a, b) => b - a)
  }), [events, users]);

  // Add error boundary for API calls
  const handleApiError = (error, operation) => {
    console.error(`Error during ${operation}:`, error);
    const errorMessage = error.response?.data?.error || `Failed to ${operation}`;
    setFormErrors({ api: errorMessage });
    toast.error(errorMessage);
  };

  // Enhanced fetch events with error handling and loading states
  const fetchEvents = async (showLoading = true) => {
    if (showLoading) setIsLoading(prev => ({ ...prev, refresh: true }));
    try {
      const [eventsRes, usersRes, venuesRes] = await Promise.all([
        api.get("/events"),
        api.get("/users"),
        api.get("/venues")
      ]);
      setEvents(eventsRes.data);
      setUsers(usersRes.data);
      setVenues(venuesRes.data);
      setError(null);
    } catch (error) {
      handleApiError(error, "fetch data");
      setError("Failed to fetch events.");
    } finally {
      setIsLoading(prev => ({ 
        ...prev, 
        initial: false,
        refresh: false 
      }));
    }
  };

  // Update useEffect to use the new fetchEvents function
  useEffect(() => {
    fetchEvents(false); // Don't show refresh loading on initial load
  }, []);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + R to refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
      // Ctrl/Cmd + N to add new event
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddDialog();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Unique sport, consultant, and year options
  const sportOptions = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => e.sport)));
    return unique.filter(Boolean).sort();
  }, [events]);

  const consultantOptions = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => e.consultant_id)));
    return unique.filter(Boolean).sort();
  }, [events]);

  const yearOptions = useMemo(() => {
    const unique = Array.from(new Set(events.map((e) => {
      const date = new Date(e.event_start_date);
      return date.getFullYear();
    })));
    return unique.filter(Boolean).sort((a, b) => b - a); // Sort years in descending order
  }, [events]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sportFilter, consultantFilter, statusFilter, yearFilter, searchQuery]);

  // Add/Edit form state
  const initialEventState = {
    sport: "",
    event: "",
    event_start_date: null,
    event_end_date: null,
    venue_id: "",
    consultant_id: "",
    status: ""
  };
  const [formData, setFormData] = useState(initialEventState);
  const [formErrors, setFormErrors] = useState({});

  // Validate form fields
  const validateField = (field, value) => {
    const errors = { ...formErrors };
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === "")) {
      errors[field] = "Required";
    } else {
      delete errors[field];
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to parse date from database
  const parseDateFromDB = (dateStr) => {
    if (!dateStr) return null;
    
    // Try DD-MM-YYYY format first
    let parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date());
    if (isValid(parsedDate)) return parsedDate;
    
    // Try YYYY-MM-DD format
    parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) return parsedDate;
    
    return null;
  };

  // Helper function to format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return format(date, 'dd-MM-yyyy');
  };

  // Memoize handlers to prevent unnecessary re-renders
  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedEvents(paginationData.currentItems.map((event) => event.event_id));
    } else {
      setSelectedEvents([]);
    }
  }, [paginationData.currentItems]);

  const handleSelectEvent = useCallback((eventId, checked) => {
    setSelectedEvents((prev) => 
      checked 
        ? [...prev, eventId]
        : prev.filter((id) => id !== eventId)
    );
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Optimize filter handlers
  const handleFilterChange = useCallback((filterType, value) => {
    switch (filterType) {
      case 'sport':
        setSportFilter(value);
        break;
      case 'consultant':
        setConsultantFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'year':
        setYearFilter(value);
        break;
      case 'search':
        setSearchQuery(value);
        break;
      default:
        break;
    }
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Optimize sort handlers
  const handleSortChange = useCallback((column) => {
    setSortColumn(column);
  }, []);

  const handleSortDirectionChange = useCallback((direction) => {
    setSortDirection(direction);
  }, []);

  // Memoize dialog handlers
  const openAddDialog = useCallback(() => {
    setFormData(initialEventState);
    setFormErrors({});
    setIsAddDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((event) => {
    setEditingEvent(event);
    setFormData({
      sport: event.sport,
      event: event.event,
      event_start_date: parseDateFromDB(event.event_start_date),
      event_end_date: parseDateFromDB(event.event_end_date),
      venue_id: event.venue_id,
      consultant_id: event.consultant_id || "",
      status: event.status || ""
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((event) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  }, []);

  // Optimize bulk actions
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedEvents([]); // Clear selection when toggling mode
  }, []);

  // Add refresh button handler
  const handleRefresh = useCallback(() => {
    fetchEvents(true);
  }, []);

  // Memoize the table row component
  const EventTableRow = useMemo(() => {
    return ({ event }) => (
      <TableRow key={event.event_id} className="hover:bg-muted/50">
        <TableCell className="text-xs py-1.5">
          <Checkbox
            checked={selectedEvents.includes(event.event_id)}
            onCheckedChange={(checked) => handleSelectEvent(event.event_id, checked)}
            aria-label={`Select ${event.event}`}
            className="h-4 w-4"
          />
        </TableCell>
        <TableCell className="text-xs py-1.5">{event.sport}</TableCell>
        <TableCell className="text-xs py-1.5">{event.event}</TableCell>
        <TableCell className="text-xs py-1.5">{event.event_start_date}</TableCell>
        <TableCell className="text-xs py-1.5">{event.event_end_date}</TableCell>
        <TableCell className="text-xs py-1.5">{getVenueName(event.venue_id)}</TableCell>
        <TableCell className="text-xs py-1.5">{getConsultantName(event.consultant_id)}</TableCell>
        <TableCell className="text-xs py-1.5">
          <Badge
            variant="outline"
            className={`${
              event.status === "sales closed"
                ? "bg-destructive/10 text-destructive"
                : event.status === "sales open"
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }`}
          >
            {event.status === "sales open" ? "Sales Open" : "Sales Closed"}
          </Badge>
        </TableCell>
        <TableCell className="text-xs py-1.5">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditDialog(event)}
              className="h-7 w-7"
              disabled={isLoading.edit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(event)}
              disabled={isLoading.delete}
              className="h-7 w-7"
            >
              {isLoading.delete && eventToDelete?.event_id === event.event_id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [isSelectionMode, selectedEvents, isLoading.edit, isLoading.delete, eventToDelete, handleSelectEvent, openEditDialog, handleDeleteClick, venues, users]);

  // Update the table body to use the memoized row component
  const tableBody = useMemo(() => {
    if (isLoading.initial) {
      return (
        <TableRow>
          <TableCell
            colSpan={9}
            className="text-center text-muted-foreground text-xs py-1.5"
          >
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading events...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (paginationData.currentItems.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={9}
            className="text-center text-muted-foreground text-xs py-1.5"
          >
            No events found.
          </TableCell>
        </TableRow>
      );
    }

    return paginationData.currentItems.map((event) => (
      <EventTableRow key={event.event_id} event={event} />
    ));
  }, [isLoading.initial, paginationData.currentItems, EventTableRow]);

  // Add this new function after the validateField function
  const validateDuplicateEvent = (sport, event, currentEventId = null) => {
    const isDuplicate = events.some(
      (e) => 
        e.event.toLowerCase() === event.toLowerCase() && 
        e.sport.toLowerCase() === sport.toLowerCase() &&
        e.event_id !== currentEventId
    );

    if (isDuplicate) {
      setFormErrors({
        api: `An event "${event}" already exists for ${sport}. Please use a different name or sport.`
      });
      return true;
    }
    return false;
  };

  // Add event
  const handleAddEvent = async () => {
    // Validate required fields
    const requiredFields = ["sport", "event", "event_start_date", "event_end_date", "venue_id", "consultant_id"];
    const errors = {};
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = "Required";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Check for duplicate event
    if (validateDuplicateEvent(formData.sport, formData.event)) {
      return;
    }

    setIsAdding(true);
    try {
      // Create eventData without the status field
      const { status, ...eventData } = {
        event_id: uuidv4(),
        sport: formData.sport,
        event: formData.event,
        event_start_date: formatDateForDisplay(formData.event_start_date),
        event_end_date: formatDateForDisplay(formData.event_end_date),
        venue_id: formData.venue_id,
        consultant_id: formData.consultant_id
      };

      await api.post("/events", eventData);
      setSuccessMessage("Event added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
      // Refresh
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Error adding event:", error);
      setFormErrors({ api: "Failed to add event" });
    } finally {
      setIsAdding(false);
    }
  };

  // Edit event
  const handleEditEvent = async () => {
    if (!editingEvent) return;

    // Validate required fields
    const requiredFields = ["sport", "event", "event_start_date", "event_end_date", "venue_id", "consultant_id"];
    const errors = {};
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = "Required";
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Check for duplicate event
    if (validateDuplicateEvent(formData.sport, formData.event, editingEvent.event_id)) {
      return;
    }

    // Check if any changes were made
    const hasChanges = 
      formData.sport !== editingEvent.sport ||
      formData.event !== editingEvent.event ||
      formatDateForDisplay(formData.event_start_date) !== editingEvent.event_start_date ||
      formatDateForDisplay(formData.event_end_date) !== editingEvent.event_end_date ||
      formData.venue_id !== editingEvent.venue_id ||
      formData.consultant_id !== editingEvent.consultant_id;

    if (!hasChanges) {
      toast.info("No changes were made to the event.");
      setIsEditDialogOpen(false);
      return;
    }

    setIsEditing(true);
    try {
      // Prepare all updates in a single array, excluding status unless it's an empty string
      const updates = Object.entries(formData)
        .filter(([key, value]) => key !== 'status' || value === '')
        .map(([key, value]) => {
          // Format dates if they exist
          if (key === 'event_start_date' || key === 'event_end_date') {
            return {
              column: key,
              value: value ? formatDateForDisplay(value) : null
            };
          }
          return {
            column: key,
            value: value
          };
        });

      // Make a single bulk update request
      await api.put(`/events/event_id/${editingEvent.event_id}/bulk`, updates);

      setSuccessMessage("Event updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      // Refresh
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Failed to update event:", error);
      setFormErrors({ api: "Failed to update event" });
    } finally {
      setIsEditing(false);
    }
  };

  // Delete event
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/events/event_id/${eventToDelete.event_id}`);
      setSuccessMessage("Event deleted successfully!");
      setShowSuccessDialog(true);
      setShowDeleteDialog(false);
      // Refresh
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Failed to delete event:", error);
      setFormErrors({ api: "Failed to delete event" });
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  // Add bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedEvents.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete events one by one
      for (const eventId of selectedEvents) {
        await api.delete(`/events/event_id/${eventId}`);
      }

      setSuccessMessage(
        `${selectedEvents.length} event(s) deleted successfully!`
      );
      setShowSuccessDialog(true);
      setSelectedEvents([]);

      // Refresh the events list
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Failed to delete events:", error);
      toast.error("Failed to delete some events");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-destructive flex flex-col items-center gap-4">
        <p>{error}</p>
        <Button onClick={() => fetchEvents(true)} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading.initial) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredEvents.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 w-full">

      {/* Filters */}
      <div className="flex items-end gap-2 justify-between">
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
          <Combobox
            options={[
              { value: "all", label: "All Sports" },
              ...filterOptions.sports.map((sport) => ({ value: sport, label: sport })),
            ]}
            value={sportFilter}
            onChange={setSportFilter}
            placeholder="Filter by Sport"
            className="w-[300px]"
          />
          <Select value={consultantFilter} onValueChange={setConsultantFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Consultant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Consultants</SelectItem>
              {filterOptions.consultants.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sales open">Sales Open</SelectItem>
              <SelectItem value="sales closed">Sales Closed</SelectItem>
              <SelectItem value="coming soon">Coming Soon</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {filterOptions.years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading.refresh}
          >
            {isLoading.refresh ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          {selectedEvents.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={isLoading.bulkDelete}
            >
              {isLoading.bulkDelete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedEvents.length})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
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
              Sorted by{" "}
              <span className="font-medium">
                {sortColumns.find((c) => c.value === sortColumn)?.label}
              </span>{" "}
              ({sortDirection === "asc" ? "A-Z" : "Z-A"})
            </span>
          </div>
          <Button onClick={openAddDialog} disabled={isLoading.add}>
            {isLoading.add ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </>
            )}
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="w-[50px] text-xs py-2">
                <Checkbox
                  checked={selectedEvents.length === paginationData.currentItems.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead className="text-xs py-2">Sport</TableHead>
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Start Date</TableHead>
              <TableHead className="text-xs py-2">End Date</TableHead>
              <TableHead className="text-xs py-2">Venue</TableHead>
              <TableHead className="text-xs py-2">Consultant</TableHead>
              <TableHead className="text-xs py-2">Status</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableBody}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and summary */}
      <div className="flex items-center justify-between">
        <Pagination className="flex items-center justify-start">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map((page) => (
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
                  setCurrentPage((prev) => Math.min(paginationData.totalPages, prev + 1))
                }
                className={
                  currentPage === paginationData.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <div className="text-sm text-muted-foreground">
          Showing {paginationData.startIndex + 1} to{" "}
          {Math.min(paginationData.endIndex, filteredEvents.length)} of{" "}
          {filteredEvents.length} events
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingEvent(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the event details"
                : "Fill in the details for the new event"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 relative">
            {(isAdding || isEditing) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {isEditDialogOpen ? "Updating Event..." : "Adding Event..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your request
                  </p>
                </div>
              </div>
            )}
            <div className={isAdding || isEditing ? "opacity-50 pointer-events-none" : "space-y-6"}>
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Sport */}
                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport</Label>
                    {showCustomSportInput ? (
                      <div className="flex gap-2">
                        <Input
                          id="sport"
                          value={formData.sport}
                          onChange={(e) => handleFieldChange("sport", e.target.value)}
                          disabled={isAdding || isEditing}
                          placeholder="Enter custom sport"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setShowCustomSportInput(false);
                            handleFieldChange("sport", "");
                          }}
                          disabled={isAdding || isEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={formData.sport || "none"}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            setShowCustomSportInput(true);
                            handleFieldChange("sport", "");
                          } else {
                            handleFieldChange("sport", value === "none" ? "" : value);
                          }
                        }}
                        disabled={isAdding || isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sport" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {sportOptions.map((sport) => (
                            <SelectItem key={sport} value={sport}>
                              {sport}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">+ Add Custom Sport</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {formErrors.sport && (
                      <p className="text-sm text-red-500">{formErrors.sport}</p>
                    )}
                  </div>

                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="event">Event Name</Label>
                    <Input
                      id="event"
                      value={formData.event}
                      onChange={(e) => handleFieldChange("event", e.target.value)}
                      disabled={isAdding || isEditing}
                      placeholder="e.g., Abu Dhabi Grand Prix 2025"
                    />
                    {formErrors.event && (
                      <p className="text-sm text-red-500">{formErrors.event}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Event Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.event_start_date && "text-muted-foreground"
                          )}
                          disabled={isAdding || isEditing}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.event_start_date ? (
                            format(formData.event_start_date, "dd-MM-yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.event_start_date}
                          onSelect={(date) => handleFieldChange("event_start_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.event_start_date && (
                      <p className="text-sm text-red-500">{formErrors.event_start_date}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.event_end_date && "text-muted-foreground"
                          )}
                          disabled={isAdding || isEditing}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.event_end_date ? (
                            format(formData.event_end_date, "dd-MM-yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.event_end_date}
                          onSelect={(date) => handleFieldChange("event_end_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.event_end_date && (
                      <p className="text-sm text-red-500">{formErrors.event_end_date}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Assignment</h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Venue Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="venue_id">Venue</Label>
                    <Combobox
                      options={venues.map(venue => ({
                        value: venue.venue_id,
                        label: `${venue.venue_name} (${venue.city})`,
                        searchText: `${venue.venue_name} ${venue.city}`.toLowerCase()
                      }))}
                      value={formData.venue_id}
                      onChange={(value) => handleFieldChange("venue_id", value)}
                      placeholder="Search by venue name or city"
                      disabled={isAdding || isEditing}
                    />
                    {formErrors.venue_id && (
                      <p className="text-sm text-red-500">{formErrors.venue_id}</p>
                    )}
                  </div>

                  {/* Consultant Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="consultant_id">Consultant</Label>
                    <Select
                      value={formData.consultant_id || "none"}
                      onValueChange={(value) => handleFieldChange("consultant_id", value === "none" ? "" : value)}
                      disabled={isAdding || isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a consultant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {users
                          .filter(user => user.role === "Internal Sales")
                          .map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.consultant_id && (
                      <p className="text-sm text-red-500">{formErrors.consultant_id}</p>
                    )}
                  </div>
                </div>
              </div>

              {formErrors.api && (
                <div className="text-sm text-red-500 text-center">
                  {formErrors.api}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingEvent(null);
              }}
              disabled={isAdding || isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEditEvent : handleAddEvent}
              disabled={isAdding || isEditing}
              className="min-w-[100px]"
            >
              {isAdding || isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditDialogOpen ? "Updating..." : "Adding..."}
                </>
              ) : isEditDialogOpen ? (
                "Update Event"
              ) : (
                "Add Event"
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
              This action cannot be undone. This will permanently delete the
              event "{eventToDelete?.event}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
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
          {isDeleting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-destructive/20"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-destructive border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-lg font-medium text-destructive">
                  Deleting Event...
                </p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your request
                </p>
              </div>
            </div>
          )}
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedEvents.length} selected event(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleBulkDelete();
                setShowBulkDeleteDialog(false);
                setIsSelectionMode(false); // Exit selection mode after deletion
              }}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { EventsTable };
