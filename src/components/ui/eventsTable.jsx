import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
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
import { Plus, Trash2, Pencil, Loader2, CheckCircle2, X } from "lucide-react";
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
  const [users, setUsers] = useState([]);
  const [showCustomSportInput, setShowCustomSportInput] = useState(false);

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
    sport: "Sport",
    event: "Event",
    event_id: "Event ID",
    event_start_date: "Event Start date",
    event_end_date: "Event End Date",
    venue_id: "Venue ID",
    consultant_id: "Consultant ID",
    status: "status"
  };

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const [eventsRes, usersRes, venuesRes] = await Promise.all([
          api.get("/event"),
          api.get("/users"),
          api.get("/venues")
        ]);
        setEvents(eventsRes.data);
        setUsers(usersRes.data);
        setVenues(venuesRes.data);
      } catch (err) {
        setError("Failed to fetch events.");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
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

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    let result = events.filter((event) => {
      const sportMatch = sportFilter === "all" || event.sport === sportFilter;
      const consultantMatch = consultantFilter === "all" || event.consultant_id === consultantFilter;
      const statusMatch = statusFilter === "all" || event.status === statusFilter;
      const yearMatch = yearFilter === "all" || new Date(event.event_start_date).getFullYear().toString() === yearFilter;
      const searchMatch = searchQuery === "" || 
        event.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.sport.toLowerCase().includes(searchQuery.toLowerCase());
      return sportMatch && consultantMatch && statusMatch && yearMatch && searchMatch;
    });
    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const aVal = (a[sortColumn] || "").toString().toLowerCase();
        const bVal = (b[sortColumn] || "").toString().toLowerCase();
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [events, sportFilter, consultantFilter, statusFilter, yearFilter, searchQuery, sortColumn, sortDirection]);

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
    status: "sales open"
  };
  const [formData, setFormData] = useState(initialEventState);
  const [formErrors, setFormErrors] = useState({});

  // Add/Edit handlers
  const openAddDialog = () => {
    setFormData(initialEventState);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };
  const openEditDialog = (event) => {
    setEditingEvent(event);
    setFormData({
      sport: event.sport,
      event: event.event,
      event_start_date: parseDateFromDB(event.event_start_date),
      event_end_date: parseDateFromDB(event.event_end_date),
      venue_id: event.venue_id,
      consultant_id: event.consultant_id || "",
      status: event.status || "sales open"
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };
  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  // Validate form fields
  const validateField = (field, value) => {
    const errors = { ...formErrors };
    if (!value || value.trim() === "") {
      errors[field] = "Required";
    } else {
      delete errors[field];
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
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
    const isDuplicate = events.some(
      (e) => e.event === formData.event && e.sport === formData.sport
    );

    if (isDuplicate) {
      setFormErrors({
        api: `An event "${formData.event}" already exists for ${formData.sport}`,
      });
      return;
    }

    setIsAdding(true);
    try {
      const eventData = {
        sport: formData.sport,
        event: formData.event,
        event_start_date: formatDateForDisplay(formData.event_start_date),
        event_end_date: formatDateForDisplay(formData.event_end_date),
        venue_id: formData.venue_id,
        consultant_id: formData.consultant_id,
        status: ""
      };

      await api.post("/event", eventData);
      setSuccessMessage("Event added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
      // Refresh
      const res = await api.get("/event");
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

    // Check for duplicate event (excluding the current event being edited)
    const isDuplicate = events.some(
      (e) =>
        e.event === formData.event &&
        e.sport === formData.sport &&
        e.event_id !== editingEvent.event_id
    );

    if (isDuplicate) {
      setFormErrors({
        api: `An event "${formData.event}" already exists for ${formData.sport}`,
      });
      return;
    }

    setIsEditing(true);
    try {
      // Compare with original event to find changed fields
      const changedFields = {};
      Object.keys(formData).forEach((key) => {
        if (key === 'event_start_date' || key === 'event_end_date') {
          const newValue = formatDateForDisplay(formData[key]);
          const oldValue = editingEvent[key];
          if (newValue !== oldValue) {
            changedFields[key] = newValue;
          }
        } else if (key !== 'status' && formData[key] !== editingEvent[key]) {
          changedFields[key] = formData[key];
        }
      });

      // Only update if there are changes
      if (Object.keys(changedFields).length === 0) {
        setSuccessMessage("No changes were made");
        setShowSuccessDialog(true);
        setIsEditDialogOpen(false);
        return;
      }

      // Update only changed fields
      for (const [column, value] of Object.entries(changedFields)) {
        await api.put(`/event/Event ID/${editingEvent.event_id}`, {
          column: columnMap[column],
          value,
        });
      }

      setSuccessMessage("Event updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      // Refresh
      const res = await api.get("/event");
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
      await api.delete(`/event/Event ID/${eventToDelete.event_id}`);
      setSuccessMessage("Event deleted successfully!");
      setShowSuccessDialog(true);
      setShowDeleteDialog(false);
      // Refresh
      const res = await api.get("/event");
      setEvents(res.data);
    } catch (error) {
      console.error("Failed to delete event:", error);
      setFormErrors({ api: "Failed to delete event" });
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  // Add bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents(currentItems.map((event) => event.event_id));
    } else {
      setSelectedEvents([]);
    }
  };

  const handleSelectEvent = (eventId, checked) => {
    if (checked) {
      setSelectedEvents((prev) => [...prev, eventId]);
    } else {
      setSelectedEvents((prev) => prev.filter((id) => id !== eventId));
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEvents([]); // Clear selection when toggling mode
  };

  // Add bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedEvents.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete events one by one
      for (const eventId of selectedEvents) {
        await api.delete(`/event/Event ID/${eventId}`);
      }

      setSuccessMessage(
        `${selectedEvents.length} event(s) deleted successfully!`
      );
      setShowSuccessDialog(true);
      setSelectedEvents([]);

      // Refresh the events list
      const res = await api.get("/event");
      setEvents(res.data);
    } catch (error) {
      console.error("Failed to delete events:", error);
      toast.error("Failed to delete some events");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Helper function to get venue name
  const getVenueName = (venueId) => {
    const venue = venues.find(v => v.venue_id === venueId);
    return venue ? venue.venue_name : "Unknown Venue";
  };

  // Helper function to get consultant name
  const getConsultantName = (consultantId) => {
    const consultant = users.find(u => u.user_id === consultantId);
    return consultant ? `${consultant.first_name} ${consultant.last_name}` : "Unassigned";
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Loading events...
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-destructive">{error}</div>;
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
              ...sportOptions.map((sport) => ({ value: sport, label: sport })),
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
              {users
                .filter(user => user.role === "Internal Sales")
                .map((user) => (
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
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isSelectionMode && selectedEvents.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteDialog(true)}
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? (
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
        <Button
          variant={isSelectionMode ? "secondary" : "outline"}
          size="sm"
          onClick={toggleSelectionMode}
        >
          {isSelectionMode ? "Cancel Selection" : "Bulk Actions"}
        </Button>
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
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              {isSelectionMode && (
                <TableHead className="w-[50px] text-xs py-2">
                  <Checkbox
                    checked={selectedEvents.length === currentItems.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
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
            {currentItems.length > 0 ? (
              currentItems.map((event) => (
                <TableRow key={event.event_id} className="hover:bg-muted/50">
                  {isSelectionMode && (
                    <TableCell className="text-xs py-1.5">
                      <Checkbox
                        checked={selectedEvents.includes(event.event_id)}
                        onCheckedChange={(checked) =>
                          handleSelectEvent(event.event_id, checked)
                        }
                        aria-label={`Select ${event.event}`}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
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
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(event)}
                        disabled={isDeleting}
                        className="h-7 w-7"
                      >
                        {isDeleting &&
                        eventToDelete?.event_id === event.event_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isSelectionMode ? 9 : 8}
                  className="text-center text-muted-foreground text-xs py-1.5"
                >
                  No events found.
                </TableCell>
              </TableRow>
            )}
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
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to{" "}
          {Math.min(endIndex, filteredEvents.length)} of{" "}
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
