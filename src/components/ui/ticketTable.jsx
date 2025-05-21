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
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Search,
  Filter,
  Pencil,
  Loader2,
  ChevronDown,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
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
import { Checkbox } from "@/components/ui/checkbox";

function TicketTable() {
  const [stock, setStock] = useState([]);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const itemsPerPage = 15;

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    event: "all",
    sport: "all",
    supplier: "all",
    status: {
      ordered: false,
      paid: false,
      received: false,
      provisional: false,
    },
  });

  // Form state
  const initialTicketState = {
    event: "",
    package_type: "",
    category_id: "",
    package_id: "",
    ticket_id: "",
    supplier: "",
    ref: "",
    actual_stock: 0,
    used: "",
    remaining: 0,
    "currency_(bought_in)": "EUR",
    "unit_cost_(local)": "",
    "unit_cost_(gbp)": "",
    "total_cost_(local)": "",
    "total_cost_(gbp)": "",
    is_provsional: false,
    ordered: false,
    paid: false,
    tickets_received: false,
    markup: "55",
    event_days: "",
    ticket_type: "",
  };
  const [newTicket, setNewTicket] = useState(initialTicketState);

  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [cellValue, setCellValue] = useState("");

  // Field mappings for the API
  const fieldMappings = {
    event: "Event",
    package_type: "Package Type",
    category_id: "Category ID",
    package_id: "Package ID",
    ticket_id: "Ticket ID",
    ticket_name: "Ticket Name",
    supplier: "Supplier",
    ref: "Ref",
    actual_stock: "Actual stock",
    used: "Used",
    remaining: "Remaining",
    "currency_(bought_in)": "Currency (Bought in)",
    "unit_cost_(local)": "Unit Cost (Local)",
    "unit_cost_(gbp)": "Unit Cost (GBP)",
    "total_cost_(local)": "Total Cost (Local)",
    "total_cost_(gbp)": "Total Cost (GBP)",
    is_provsional: "Is Provsional",
    ordered: "Ordered",
    paid: "Paid",
    tickets_received: "Tickets Received",
    markup: "Markup",
    event_days: "Event Days",
    ticket_type: "Ticket Type",
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessDialogShown, setIsSuccessDialogShown] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const sortColumns = [
    { value: "event", label: "Event" },
    { value: "ticket_name", label: "Ticket Name" },
    { value: "supplier", label: "Supplier" },
    { value: "ref", label: "Reference" },
    { value: "actual_stock", label: "Stock" },
    { value: "used", label: "Used" },
    { value: "remaining", label: "Remaining" },
    { value: "unit_cost_(gbp)", label: "Unit Cost (GBP)" },
  ];
  const [sortColumn, setSortColumn] = useState("event");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [stockRes, eventsRes, packagesRes] = await Promise.all([
        api.get("new%20stock%20-%20tickets"),
        api.get("event"),
        api.get("packages"),
      ]);

      // Ensure we have valid arrays with required properties
      const validEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const validPackages = Array.isArray(packagesRes.data)
        ? packagesRes.data
        : [];
      const validStock = Array.isArray(stockRes.data) ? stockRes.data : [];

      setStock(validStock);
      setEvents(validEvents);
      setPackages(validPackages);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      // Set empty arrays as fallback
      setStock([]);
      setEvents([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch categories for an event
  const fetchCategoriesForEvent = async (eventId) => {
    try {
      console.log("Fetching categories for event ID:", eventId);
      // First get the event to get its venue_id
      const event = events.find(e => e.event_id === eventId);
      if (!event?.venue_id) {
        console.error("No venue_id found for event:", event);
        setCategories([]);
        return;
      }

      // Then fetch categories using the venue_id
      const response = await api.get(`n-categories?venue_id=${event.venue_id}`);
      console.log("Categories response:", response.data);
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error("Failed to load categories");
      setCategories([]);
    }
  };

  // Add function to get event ID from event name
  const getEventIdFromName = (eventName) => {
    console.log("Getting event ID for:", eventName);
    console.log("Available events:", events);
    const event = events.find(e => e.event === eventName);
    console.log("Found event:", event);
    return event?.event_id;
  };

  // Add useEffect to log when events change
  useEffect(() => {
    console.log("Events updated:", events);
  }, [events]);

  // Helper function to safely get event value and display
  const getEventValue = (event) => {
    if (!event) return "unknown";
    return event.event_id || "unknown";
  };

  const getEventDisplay = (event) => {
    if (!event) return "Unknown Event";
    return `${event.event} (${event.sport})`;
  };

  // Helper function to safely get package value and display
  const getPackageValue = (pkg) => {
    if (!pkg) return "unknown";
    return pkg.package_id || "unknown";
  };

  const getPackageDisplay = (pkg) => {
    if (!pkg) return "Unknown Package";
    return `${pkg.package_type} (${pkg.package_type})`;
  };

  // Get unique sports for filter
  const getUniqueSports = () => {
    const uniqueSports = [...new Set(events.map((event) => event.sport))].filter(Boolean);
    return [
      { value: "all", label: "All Sports" },
      ...uniqueSports.map(sport => ({
        value: sport,
        label: sport || "Unknown Sport"
      }))
    ];
  };

  // Get unique events for filter based on selected sport
  const getFilteredEvents = () => {
    const filteredEvents = events.filter(event => 
      filters.sport === "all" || event.sport === filters.sport
    );
    const uniqueEvents = filteredEvents.reduce((acc, event) => {
      if (!acc.some(e => e.value === event.event)) {
        acc.push({
          value: event.event,
          label: `${event.event}`
        });
      }
      return acc;
    }, []);
    return [
      { value: "all", label: "All Events" },
      ...uniqueEvents
    ];
  };

  // Get unique suppliers for filter
  const getUniqueSuppliers = () => {
    const uniqueSuppliers = [...new Set(stock.map((item) => item.supplier))].filter(Boolean);
    return [
      { value: "all", label: "All Suppliers" },
      ...uniqueSuppliers.map(supplier => ({
        value: supplier,
        label: supplier || "Unknown Supplier"
      }))
    ];
  };

  // Filter functions
  const filterStock = (items) => {
    return items.filter((item) => {
      // Search filter
      const searchMatch =
        filters.search === "" ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      // Event filter
      const eventMatch =
        filters.event === "all" || item.event === filters.event;

      // Sport filter
      const sportMatch =
        filters.sport === "all" || 
        events.find(e => e.event === item.event)?.sport === filters.sport;

      // Supplier filter
      const supplierMatch =
        filters.supplier === "all" || item.supplier === filters.supplier;

      // Status filters
      const statusMatch =
        (!filters.status.ordered || item.ordered) &&
        (!filters.status.paid || item.paid) &&
        (!filters.status.received || item.tickets_received) &&
        (!filters.status.provisional || item.is_provsional);

      return (
        searchMatch && eventMatch && sportMatch && supplierMatch && statusMatch
      );
    });
  };

  // Filtered and sorted stock
  const filteredStock = useMemo(() => {
    let result = filterStock(stock);
    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        // For numbers, sort numerically
        if (["actual_stock", "used", "remaining", "unit_cost_(gbp)"].includes(sortColumn)) {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        } else {
          aVal = (aVal || "").toString().toLowerCase();
          bVal = (bVal || "").toString().toLowerCase();
          if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
          if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
          return 0;
        }
      });
    }
    return result;
  }, [stock, filters, sortColumn, sortDirection]);

  // Add ticket
  const handleAddTicket = async (formData) => {
    try {
      setIsAdding(true);
      toast.loading("Adding ticket...");

      console.log("Form data received:", formData);

      // Get the event ID from the selected event name
      const event = events.find(e => e.event === formData.event);
      if (!event) {
        throw new Error("Selected event not found");
      }

      // Create a new object with the exact field names that match the backend
      const ticketData = {
        event_id: event.event_id,
        category_id: formData.category_id,
        supplier: formData.supplier,
        ref: formData.ref,
        actual_stock: formData.actual_stock,
        used: formData.used,
        remaining: "",  // Set remaining as empty string
        currency_bought_in: formData["currency_(bought_in)"],
        unit_cost_local: formData["unit_cost_(local)"],
        unit_cost_gbp: formData["unit_cost_(gbp)"],
        total_cost_local: formData["total_cost_(local)"],
        total_cost_gbp: formData["total_cost_(gbp)"],
        is_provsional: formData.is_provsional,
        ordered: formData.ordered,
        paid: formData.paid,
        tickets_received: formData.tickets_received,
        markup: formData.markup,
        event_days: formData.event_days,
        ticket_type: formData.ticket_type,
        event: formData.event,
        package_type: formData.package_type
      };

      console.log("Ticket data being sent:", ticketData);

      await api.post("new%20stock%20-%20tickets", ticketData);
      toast.dismiss();
      toast.success("Ticket added successfully!");
      setIsAddDialogOpen(false);
      
      // Refresh the tickets list
      const res = await api.get("new%20stock%20-%20tickets");
      setStock(res.data);
    } catch (error) {
      console.error("Failed to add ticket:", error);
      toast.dismiss();
      toast.error("Failed to add ticket. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Add useEffect to fetch tickets when success dialog appears
  useEffect(() => {
    const fetchTickets = async () => {
      if (showSuccessDialog) {
        try {
          const [stockRes] = await Promise.all([
            api.get("Stock%20-%20tickets"),
          ]);
          setStock(stockRes.data);
        } catch (error) {
          console.error("Failed to fetch tickets:", error);
        }
      }
    };

    fetchTickets();
  }, [showSuccessDialog]);

  // Delete ticket
  const handleDeleteTicket = async (ticketId) => {
    setTicketToDelete(ticketId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      toast.loading("Deleting ticket...");

      await api.delete(`New Stock - tickets/ticket_id/${ticketToDelete}`);
      setStock((prevStock) =>
        prevStock.filter((ticket) => ticket.ticket_id !== ticketToDelete)
      );

      toast.dismiss();
      toast.success("Ticket deleted successfully!");
      setShowDeleteConfirm(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.dismiss();
      toast.error("Failed to delete ticket. Please try again.");
      setShowDeleteConfirm(false);
      setTicketToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Update ticket
  const handleEditTicket = async (changedFields) => {
    try {
      setIsEditing(true);
      const loadingToast = toast.loading("Updating ticket...");

      if (Object.keys(changedFields).length === 0) {
        toast.dismiss(loadingToast);
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        setEditingTicket(null);
        return;
      }

      const ticketId = editingTicket.ticket_id;

      // If event is being changed, get the new event ID
      if (changedFields.event) {
        const event = events.find(e => e.event === changedFields.event);
        if (event) {
          changedFields.event_id = event.event_id;
        }
      }

      const excludedFields = [
        "actual_stock",
        "used",
        "remaining",
        "total_cost_local",
        "unit_cost_gbp",
        "total_cost_gbp",
        "currency_bought_in",
      ];

      const filteredChanges = Object.entries(changedFields).reduce(
        (acc, [field, value]) => {
          if (!excludedFields.includes(field)) {
            acc[field] = value;
          }
          return acc;
        },
        {}
      );

      if (Object.keys(filteredChanges).length === 0) {
        toast.dismiss(loadingToast);
        toast.info("No valid changes were made");
        setIsEditDialogOpen(false);
        setEditingTicket(null);
        return;
      }

      for (const [field, value] of Object.entries(filteredChanges)) {
        if (value !== undefined && value !== null && fieldMappings[field]) {
          const updateData = {
            column: fieldMappings[field],
            value: value,
          };

          await api.put(`/New Stock - tickets/ticket_id/${ticketId}`, updateData);
        }
      }

      await fetchInitialData();
      toast.dismiss(loadingToast);
      setIsEditDialogOpen(false);
      setEditingTicket(null);
      return true;
    } catch (error) {
      console.error("Failed to update ticket:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.dismiss();
      toast.error("Failed to update ticket. Please try again.");
      return false;
    } finally {
      setIsEditing(false);
    }
  };

  const handleCellEdit = (rowId, field, value) => {
    setEditingCell({ rowId, field });
    setCellValue(value);
  };

  const handleCellSave = async (rowId, field) => {
    try {
      const ticket = stock.find((t) => t.ticket_id === rowId);
      if (!ticket) return;

      // Only update the specific field
      const updateData = {
        [field]: cellValue,
      };

      // If updating stock or used, calculate remaining
      if (field === "actual_stock" || field === "used") {
        const newStock =
          field === "actual_stock" ? cellValue : ticket.actual_stock;
        const newUsed = field === "used" ? cellValue : ticket.used;
        updateData.remaining = newStock - newUsed;
      }

      // If updating total cost or stock, calculate unit cost
      if (field === "total_cost_local" || field === "actual_stock") {
        const newTotal =
          field === "total_cost_local" ? cellValue : ticket.total_cost_local;
        const newStock =
          field === "actual_stock" ? cellValue : ticket.actual_stock;
        updateData["unit_cost_(gbp)"] =
          newStock > 0 ? (newTotal / newStock).toFixed(2) : 0;
      }

      console.log("Updating field:", field, "with value:", cellValue);
      await api.put(`New%20Stock%20-%20tickets/${rowId}`, updateData);
      toast.success("Field updated successfully");
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update field:", error);
      toast.error("Failed to update field");
    } finally {
      setEditingCell({ rowId: null, field: null });
      setCellValue("");
    }
  };

  const handleCellCancel = () => {
    setEditingCell({ rowId: null, field: null });
    setCellValue("");
  };

  // Apply filters and calculate pagination
  const totalPages = Math.ceil(filteredStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredStock.slice(startIndex, endIndex);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleFieldUpdate = async (ticketId, field, value) => {
    try {
      console.log("Updating single field:", { ticketId, field, value });

      // Map the field to the correct column name
      const columnMappings = {
        event: "Event",
        package_type: "Package Type",
        ticket_name: "Ticket Name",
        supplier: "Supplier",
        ref: "Ref",
        actual_stock: "Actual stock",
        used: "Used",
        currency_bought_in: "Currency (Bought in)",
        total_cost_local: "Total Cost  (Local)",
        is_provsional: "Is Provsional",
        ordered: "Ordered",
        paid: "Paid",
        tickets_received: "Tickets Received",
        markup: "Markup",
        event_days: "Event Days",
        ticket_type: "Ticket Type",
        video_wall: "Video Wall",
        covered_seat: "Covered Seat",
        numbered_seat: "Numbered Seat",
        delivery_days: "Delivery days",
        ticket_description: "Ticket Description",
        ticket_image_1: "Ticket image 1",
        ticket_image_2: "Ticket Image 2",
      };

      const columnName = columnMappings[field];
      if (!columnName) {
        throw new Error(`Invalid field: ${field}`);
      }

      // Create the update payload with the column name and value
      const updateData = {
        column: columnName,
        value: value,
      };

      // Properly encode the URL
      const encodedEndpoint = encodeURIComponent("New Stock - tickets");
      console.log("Making API PUT request for single cell update...");
      console.log("Endpoint:", `/${encodedEndpoint}/ticket_id/${ticketId}`);
      console.log("Request body:", updateData);

      const response = await api.put(
        `/${encodedEndpoint}/ticket_id/${ticketId}`,
        updateData
      );
      console.log("API response:", response);

      // Update the local state immediately
      setStock((prevStock) =>
        prevStock.map((ticket) => {
          if (ticket.ticket_id === ticketId) {
            // Create a new ticket object with the updated field
            const updatedTicket = { ...ticket, [field]: value };

            // If we're updating stock or used, recalculate remaining
            if (field === "actual_stock" || field === "used") {
              const newStock =
                field === "actual_stock" ? value : ticket.actual_stock;
              const newUsed = field === "used" ? value : ticket.used;
              updatedTicket.remaining = newStock - newUsed;
            }

            // If we're updating total cost or stock, recalculate unit cost
            if (field === "total_cost_local" || field === "actual_stock") {
              const newTotal =
                field === "total_cost_local" ? value : ticket.total_cost_local;
              const newStock =
                field === "actual_stock" ? value : ticket.actual_stock;
              updatedTicket["unit_cost_(gbp)"] =
                newStock > 0 ? (newTotal / newStock).toFixed(2) : 0;
            }

            return updatedTicket;
          }
          return ticket;
        })
      );

      // If we're editing a ticket in the dialog, update that too
      if (editingTicket && editingTicket.ticket_id === ticketId) {
        setEditingTicket((prev) => {
          const updated = { ...prev, [field]: value };

          // Recalculate derived fields if needed
          if (field === "actual_stock" || field === "used") {
            const newStock =
              field === "actual_stock" ? value : prev.actual_stock;
            const newUsed = field === "used" ? value : prev.used;
            updated.remaining = newStock - newUsed;
          }

          if (field === "total_cost_local" || field === "actual_stock") {
            const newTotal =
              field === "total_cost_local" ? value : prev.total_cost_local;
            const newStock =
              field === "actual_stock" ? value : prev.actual_stock;
            updated["unit_cost_(gbp)"] =
              newStock > 0 ? (newTotal / newStock).toFixed(2) : 0;
          }

          return updated;
        });
      }

      toast.success("Field updated successfully");
    } catch (error) {
      console.error("Failed to update field:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(
        `Failed to update field: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const TicketForm = ({
    formData,
    setFormData,
    events,
    packages,
    filteredPackages,
    handleSubmit,
    onCancel,
    isLoading = false,
  }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);

    // Event options for the Combobox
    const eventOptions = useMemo(() => {
      console.log("Building event options from events:", events);
      const options = events.map(event => ({
        value: event.event,
        label: `${event.event}`,
        group: event.sport || 'Other'
      }));
      console.log("Generated event options:", options);
      return options;
    }, [events]);

    // Fetch categories when event changes
    useEffect(() => {
      console.log("Event changed in form:", formData.event);
      console.log("Current events array:", events);

      const fetchCategories = async () => {
        if (!formData.event) {
          console.log("No event selected, clearing categories");
          setCategories([]);
          return;
        }

        try {
          // Get the event ID from the selected event name
          const event = events.find(e => e.event === formData.event);
          console.log("Found event object:", event);
          console.log("Event venue_id:", event?.venue_id);
          
          if (!event?.venue_id) {
            console.error("No venue_id found for event:", event);
            setCategories([]);
            return;
          }

          console.log("Making API call to fetch categories for venue_id:", event.venue_id);
          // Fetch categories using the venue_id
          const response = await api.get(`n-categories?venue_id=${event.venue_id}`);
          console.log("API Response:", response);
          
          // Filter categories by venue_id
          const filteredCategories = response.data.filter(category => {
            console.log("Checking category:", category);
            console.log("Category venue_id:", category.venue_id);
            console.log("Expected venue_id:", event.venue_id);
            return category.venue_id === event.venue_id;
          });
          
          console.log("Filtered categories for venue:", filteredCategories);
          setCategories(filteredCategories || []);

          // If we have a category_id in formData, set the selected category
          if (formData.category_id) {
            const category = filteredCategories.find(c => c.category_id === formData.category_id);
            if (category) {
              console.log("Setting selected category:", category);
              setSelectedCategory(category);
            }
          }
        } catch (error) {
          console.error("Failed to fetch categories:", error);
          console.error("Error details:", error.response?.data || error.message);
          toast.error("Failed to load categories");
          setCategories([]);
        }
      };

      fetchCategories();
    }, [formData.event, events, formData.category_id]);

    const handleCategorySelect = (category) => {
      console.log("Category selected:", category);
      setSelectedCategory(category);
      setFormData(prev => ({
        ...prev,
        category_id: category.category_id,
        package_type: category.package_type,
        ticket_image_1: category.ticket_image_1,
        ticket_image_2: category.ticket_image_2,
      }));
    };

    const handleFieldChange = (field, value) => {
      // Only allow digits
      if (["actual_stock", "unit_cost_local", "markup"].includes(field)) {
        value = value.replace(/[^0-9]/g, '');
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
      validateField(field, value);
    };

    const validateField = (field, value) => {
      const newErrors = { ...errors };

      switch (field) {
        case "actual_stock":
          if (!formData.is_provsional) {
            const num = parseInt(value);
            if (value === "" || isNaN(num) || num < 0 || !Number.isInteger(num)) {
              newErrors[field] = "Stock must be a positive integer";
            } else {
              delete newErrors[field];
            }
          }
          break;
        case "unit_cost_local":
          const num = parseInt(value);
          if (value === "" || isNaN(num) || num < 0 || !Number.isInteger(num)) {
            newErrors[field] = "Unit cost must be a positive integer";
          } else {
            delete newErrors[field];
          }
          break;
        case "markup":
          const markupNum = parseInt(value);
          if (value === "" || isNaN(markupNum) || markupNum < 0 || !Number.isInteger(markupNum)) {
            newErrors[field] = "Markup must be a positive integer";
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

    const handleBlur = (field, value) => {
      // Only validate on blur, don't restrict input
      validateField(field, value);
    };

    const handleFormSubmit = async () => {
      try {
        setIsSubmitting(true);

        const changedFields = {};
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== editingTicket[key]) {
            changedFields[key] = formData[key];
          }
        });

        const success = await handleSubmit(changedFields);
        if (success) {
          toast.success("Ticket updated successfully!");
        }
        onCancel();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(error.response?.data?.error || "Failed to update ticket");
        setErrors((prev) => ({
          ...prev,
          submit: error.response?.data?.error || "Failed to update ticket",
        }));
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="grid gap-8 py-4">
        <div className="space-y-6">
          {/* Event and Category Selection */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">Event Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event">Event</Label>
                <Combobox
                  options={eventOptions}
                  value={formData.event}
                  onChange={(value) => {
                    console.log("Combobox onChange triggered with value:", value);
                    const selectedEvent = events.find(e => e.event === value);
                    console.log("Found selected event object:", selectedEvent);
                    if (selectedEvent) {
                      console.log("Updating form with event:", value);
                      console.log("And event_id:", selectedEvent.event_id);
                      handleFieldChange("event", value);
                      handleFieldChange("event_id", selectedEvent.event_id);
                    }
                  }}
                  placeholder="Search for an event..."
                  disabled={isSubmitting}
                  groupBy="group"
                />
                {errors.event && (
                  <p className="text-sm text-primary">{errors.event}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (Ticket Name)</Label>
                <Select
                  value={selectedCategory?.category_id || ""}
                  onValueChange={(value) => {
                    console.log("Category Select onChange triggered with value:", value);
                    const category = categories.find(c => c.category_id === value);
                    console.log("Found category object:", category);
                    if (category) {
                      handleCategorySelect(category);
                    }
                  }}
                  disabled={isSubmitting || !formData.event}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.category_id}
                        value={category.category_id}
                      >
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-primary">{errors.category_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Ticket Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    handleFieldChange("supplier", e.target.value)
                  }
                  onBlur={(e) => handleBlur("supplier", e.target.value)}
                  placeholder="Enter supplier name"
                  disabled={isSubmitting}
                />
                {errors.supplier && (
                  <p className="text-sm text-primary">{errors.supplier}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Reference</Label>
                <Input
                  id="ref"
                  value={formData.ref}
                  onChange={(e) => handleFieldChange("ref", e.target.value)}
                  onBlur={(e) => handleBlur("ref", e.target.value)}
                  placeholder="Enter reference"
                  disabled={isSubmitting}
                />
                {errors.ref && (
                  <p className="text-sm text-primary">{errors.ref}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="markup">Markup (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="markup"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.markup?.replace("%", "") || 0}
                    onChange={(e) =>
                      handleFieldChange("markup", e.target.value)
                    }
                    onBlur={(e) => handleBlur("markup", e.target.value)}
                    className={`w-full ${
                      errors.markup ? "border-primary" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                {errors.markup && (
                  <p className="text-sm text-primary">{errors.markup}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_type">Ticket Type</Label>
                <Select
                  value={formData.ticket_type}
                  onValueChange={(value) =>
                    handleFieldChange("ticket_type", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "E-ticket",
                      "Collection Ticket",
                      "Paper Ticket",
                      "App Ticket",
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_days">Event Days</Label>
                <Select
                  value={formData.event_days}
                  onValueChange={(value) =>
                    handleFieldChange("event_days", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event days" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Fri - Sun",
                      "Sat - Sun",
                      "Thu - Sun",
                      "Friday",
                      "Saturday",
                      "Sunday",
                      "Thursday",
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stock and Cost Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Stock & Cost Information</h4>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="actual_stock">Stock</Label>
                <Input
                  id="actual_stock"
                  type="text"
                  value={formData.actual_stock}
                  onChange={(e) =>
                    handleFieldChange("actual_stock", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlur("actual_stock", e.target.value)
                  }
                  disabled={isSubmitting || formData.is_provsional}
                  className={formData.is_provsional ? "opacity-50" : ""}
                />
                {formData.is_provsional && (
                  <p className="text-sm text-muted-foreground">
                    Stock cannot be set for provisional tickets
                  </p>
                )}
                {errors.actual_stock && (
                  <p className="text-sm text-primary">{errors.actual_stock}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost_local">Unit Cost (Local)</Label>
                <div className="flex gap-2">
                  <Input
                    id="unit_cost_local"
                    type="text"
                    value={formData["unit_cost_(local)"]}
                    onChange={(e) =>
                      handleFieldChange("unit_cost_(local)", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlur("unit_cost_(local)", e.target.value)
                    }
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Select
                    value={formData["currency_(bought_in)"] || "EUR"}
                    onValueChange={(value) =>
                      handleFieldChange("currency_(bought_in)", value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "GBP",
                        "EUR",
                        "USD",
                        "AUD",
                        "CAD",
                        "CHF",
                        "CNY",
                        "JPY",
                        "NZD",
                        "SGD",
                      ].map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.is_provsional && (
                  <p className="text-sm text-muted-foreground">
                    Price entered is based upon the price of 1 ticket
                  </p>
                )}
                {errors["unit_cost_(local)"] && (
                  <p className="text-sm text-primary">
                    {errors["unit_cost_(local)"]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost_gbp">Unit Cost (GBP)</Label>
                <Input
                  id="unit_cost_gbp"
                  type="text"
                  value={formData["unit_cost_(gbp)"] ? Number(formData["unit_cost_(gbp)"]).toFixed(2) : ""}
                  readOnly
                  className="flex-1 bg-muted"
                  disabled={true}
                />
                {errors["unit_cost_(gbp)"] && (
                  <p className="text-sm text-primary">
                    {errors["unit_cost_(gbp)"]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Status</h4>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ordered"
                  checked={formData?.ordered || false}
                  onCheckedChange={(checked) =>
                    handleFieldChange("ordered", checked)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="ordered">Ordered</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="paid"
                  checked={formData?.paid || false}
                  onCheckedChange={(checked) =>
                    handleFieldChange("paid", checked)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="paid">Paid</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="received"
                  checked={formData?.tickets_received || false}
                  onCheckedChange={(checked) =>
                    handleFieldChange("tickets_received", checked)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="received">Received</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="provisional"
                  checked={formData?.is_provsional || false}
                  onCheckedChange={(checked) => {
                    handleFieldChange("is_provsional", checked);
                    // Reset stock to 0 when making provisional
                    if (checked) {
                      handleFieldChange("actual_stock", 0);
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Label htmlFor="provisional">Provisional</Label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting || isLoading}
              className="min-w-[100px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Ticket"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const AddTicketForm = ({
    formData,
    setFormData,
    events,
    packages,
    filteredPackages,
    handleSubmit,
    onCancel,
    isLoading = false,
  }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);

    // Event options for the Combobox
    const eventOptions = useMemo(() => {
      console.log("Building event options from events:", events);
      const options = events.map(event => ({
        value: event.event,
        label: `${event.event}`,
        group: event.sport || 'Other'
      }));
      console.log("Generated event options:", options);
      return options;
    }, [events]);

    // Fetch categories when event changes
    useEffect(() => {
      console.log("Event changed in form:", formData.event);
      console.log("Current events array:", events);

      const fetchCategories = async () => {
        if (!formData.event) {
          console.log("No event selected, clearing categories");
          setCategories([]);
          return;
        }

        try {
          // Get the event ID from the selected event name
          const event = events.find(e => e.event === formData.event);
          console.log("Found event object:", event);
          console.log("Event venue_id:", event?.venue_id);
          
          if (!event?.venue_id) {
            console.error("No venue_id found for event:", event);
            setCategories([]);
            return;
          }

          console.log("Making API call to fetch categories for venue_id:", event.venue_id);
          // Fetch categories using the venue_id
          const response = await api.get(`n-categories?venue_id=${event.venue_id}`);
          console.log("API Response:", response);
          
          // Filter categories by venue_id
          const filteredCategories = response.data.filter(category => {
            console.log("Checking category:", category);
            console.log("Category venue_id:", category.venue_id);
            console.log("Expected venue_id:", event.venue_id);
            return category.venue_id === event.venue_id;
          });
          
          console.log("Filtered categories for venue:", filteredCategories);
          setCategories(filteredCategories || []);

          // If we have a category_id in formData, set the selected category
          if (formData.category_id) {
            const category = filteredCategories.find(c => c.category_id === formData.category_id);
            if (category) {
              console.log("Setting selected category:", category);
              setSelectedCategory(category);
            }
          }
        } catch (error) {
          console.error("Failed to fetch categories:", error);
          console.error("Error details:", error.response?.data || error.message);
          toast.error("Failed to load categories");
          setCategories([]);
        }
      };

      fetchCategories();
    }, [formData.event, events, formData.category_id]);

    const handleFieldChange = (field, value) => {
      // Only allow digits
      if (["actual_stock", "unit_cost_local", "markup"].includes(field)) {
        value = value.replace(/[^0-9]/g, '');
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
      validateField(field, value);
    };

    const handleCategorySelect = (category) => {
      console.log("Category selected:", category);
      setSelectedCategory(category);
      setFormData(prev => ({
        ...prev,
        category_id: category.category_id,
        package_type: category.package_type,
        ticket_image_1: category.ticket_image_1,
        ticket_image_2: category.ticket_image_2,
      }));
    };

    const validateField = (field, value) => {
      const newErrors = { ...errors };

      switch (field) {
        case "actual_stock":
          if (!formData.is_provsional) {
            const num = parseInt(value);
            if (value === "" || isNaN(num) || num < 0 || !Number.isInteger(num)) {
              newErrors[field] = "Stock must be a positive integer";
            } else {
              delete newErrors[field];
            }
          }
          break;
        case "unit_cost_local":
          const num = parseInt(value);
          if (value === "" || isNaN(num) || num < 0 || !Number.isInteger(num)) {
            newErrors[field] = "Unit cost must be a positive integer";
          } else {
            delete newErrors[field];
          }
          break;
        case "markup":
          const markupNum = parseInt(value);
          if (value === "" || isNaN(markupNum) || markupNum < 0 || !Number.isInteger(markupNum)) {
            newErrors[field] = "Markup must be a positive integer";
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

    const handleBlur = (field, value) => {
      // Only validate on blur, don't restrict input
      validateField(field, value);
    };

    const handleFormSubmit = async () => {
      try {
        setIsSubmitting(true);

        const formattedData = {
          ...formData,
          markup: formData.markup ? `${formData.markup}%` : "0%",
          // Set stock to 0 for provisional tickets
          actual_stock: formData.is_provsional ? 0 : formData.actual_stock,
          // Ensure cost fields are empty strings
          "unit_cost_(gbp)": "",
          "total_cost_(local)": "",
          "total_cost_(gbp)": "",
          // Ensure used is empty string
          used: "",
          // Keep the unit cost local value
          "unit_cost_(local)": formData["unit_cost_(local)"],
        };

        console.log("Formatted data being sent:", formattedData); // Debug log

        await handleSubmit(formattedData);
        toast.dismiss();
        setFormData({ ...initialTicketState });
        onCancel();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.dismiss();
        toast.error("Failed to add ticket");
      } finally {
        setIsSubmitting(false);
      }
    };

    // Check if stock should be disabled (for provisional tickets)
    const isStockDisabled = formData.is_provsional;

    return (
      <div className="grid gap-8 py-4">
        <div className="space-y-6">
          {/* Event and Category Selection */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">Event Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event">Event</Label>
                <Combobox
                  options={eventOptions}
                  value={formData.event}
                  onChange={(value) => {
                    console.log("Combobox onChange triggered with value:", value);
                    const selectedEvent = events.find(e => e.event === value);
                    console.log("Found selected event object:", selectedEvent);
                    if (selectedEvent) {
                      console.log("Updating form with event:", value);
                      console.log("And event_id:", selectedEvent.event_id);
                      handleFieldChange("event", value);
                      handleFieldChange("event_id", selectedEvent.event_id);
                    }
                  }}
                  placeholder="Search for an event..."
                  disabled={isSubmitting}
                  groupBy="group"
                />
                {errors.event && (
                  <p className="text-sm text-primary">{errors.event}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (Ticket Name)</Label>
                <Select
                  value={selectedCategory?.category_id || ""}
                  onValueChange={(value) => {
                    console.log("Category Select onChange triggered with value:", value);
                    const category = categories.find(c => c.category_id === value);
                    console.log("Found category object:", category);
                    if (category) {
                      handleCategorySelect(category);
                    }
                  }}
                  disabled={isSubmitting || !formData.event}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.category_id}
                        value={category.category_id}
                      >
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-primary">{errors.category_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Ticket Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    handleFieldChange("supplier", e.target.value)
                  }
                  onBlur={(e) => handleBlur("supplier", e.target.value)}
                  placeholder="Enter supplier name"
                  disabled={isSubmitting}
                />
                {errors.supplier && (
                  <p className="text-sm text-primary">{errors.supplier}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">Reference</Label>
                <Input
                  id="ref"
                  value={formData.ref}
                  onChange={(e) => handleFieldChange("ref", e.target.value)}
                  onBlur={(e) => handleBlur("ref", e.target.value)}
                  placeholder="Enter reference"
                  disabled={isSubmitting}
                />
                {errors.ref && (
                  <p className="text-sm text-primary">{errors.ref}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="markup">Markup (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="markup"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.markup?.replace("%", "") || 0}
                    onChange={(e) =>
                      handleFieldChange("markup", e.target.value)
                    }
                    onBlur={(e) => handleBlur("markup", e.target.value)}
                    className={`w-full ${
                      errors.markup ? "border-primary" : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                {errors.markup && (
                  <p className="text-sm text-primary">{errors.markup}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_type">Ticket Type</Label>
                <Select
                  value={formData.ticket_type}
                  onValueChange={(value) =>
                    handleFieldChange("ticket_type", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "E-ticket",
                      "Collection Ticket",
                      "Paper Ticket",
                      "App Ticket",
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_days">Event Days</Label>
                <Select
                  value={formData.event_days}
                  onValueChange={(value) =>
                    handleFieldChange("event_days", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event days" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Fri - Sun",
                      "Sat - Sun",
                      "Thu - Sun",
                      "Friday",
                      "Saturday",
                      "Sunday",
                      "Thursday",
                    ].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stock and Cost Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Stock & Cost Information</h4>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="actual_stock">Stock</Label>
                <Input
                  id="actual_stock"
                  type="text"
                  value={formData.actual_stock}
                  onChange={(e) =>
                    handleFieldChange("actual_stock", e.target.value)
                  }
                  onBlur={(e) =>
                    handleBlur("actual_stock", e.target.value)
                  }
                  disabled={isSubmitting || isStockDisabled}
                  className={isStockDisabled ? "opacity-50" : ""}
                />
                {isStockDisabled && (
                  <p className="text-sm text-muted-foreground">
                    Stock cannot be set for provisional tickets
                  </p>
                )}
                {errors.actual_stock && (
                  <p className="text-sm text-primary">{errors.actual_stock}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost_local">Unit Cost (Local)</Label>
                <div className="flex gap-2">
                  <Input
                    id="unit_cost_local"
                    type="text"
                    value={formData["unit_cost_(local)"]}
                    onChange={(e) =>
                      handleFieldChange("unit_cost_(local)", e.target.value)
                    }
                    onBlur={(e) =>
                      handleBlur("unit_cost_(local)", e.target.value)
                    }
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Select
                    value={formData["currency_(bought_in)"] || "EUR"}
                    onValueChange={(value) =>
                      handleFieldChange("currency_(bought_in)", value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "GBP",
                        "EUR",
                        "USD",
                        "AUD",
                        "CAD",
                        "CHF",
                        "CNY",
                        "JPY",
                        "NZD",
                        "SGD",
                      ].map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.is_provsional && (
                  <p className="text-sm text-muted-foreground">
                    Price entered is based upon the price of 1 ticket
                  </p>
                )}
                {errors["unit_cost_(local)"] && (
                  <p className="text-sm text-primary">
                    {errors["unit_cost_(local)"]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_cost_gbp">Unit Cost (GBP)</Label>
                <Input
                  id="unit_cost_gbp"
                  type="text"
                  value={formData["unit_cost_(gbp)"] ? Number(formData["unit_cost_(gbp)"]).toFixed(2) : ""}
                  readOnly
                  className="flex-1 bg-muted"
                  disabled={true}
                />
                {errors["unit_cost_(gbp)"] && (
                  <p className="text-sm text-primary">
                    {errors["unit_cost_(gbp)"]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Status</h4>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ordered"
                  checked={formData?.ordered || false}
                  onCheckedChange={(checked) =>
                    handleFieldChange("ordered", checked)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="ordered">Ordered</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="paid"
                  checked={formData?.paid || false}
                  onCheckedChange={(checked) =>
                    handleFieldChange("paid", checked)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="paid">Paid</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="received"
                  checked={formData?.tickets_received || false}
                  onCheckedChange={(checked) =>
                    handleFieldChange("tickets_received", checked)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="received">Received</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="provisional"
                  checked={formData?.is_provsional || false}
                  onCheckedChange={(checked) => {
                    handleFieldChange("is_provsional", checked);
                    // Reset stock to 0 when making provisional
                    if (checked) {
                      handleFieldChange("actual_stock", 0);
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Label htmlFor="provisional">Provisional</Label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting || isLoading}
              className="min-w-[100px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Ticket"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const TicketDialog = ({
    isOpen,
    onOpenChange,
    mode = "add",
    ticket = null,
    isLoading = false,
  }) => {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit ? "Edit Ticket" : "Add New Ticket";
    const dialogDescription = isEdit
      ? "Update the ticket details"
      : "Fill in the details for the new ticket";

    // Initialize form data with the current ticket data
    const [formData, setFormData] = useState(() => {
      return isEdit ? { ...editingTicket } : { ...initialTicketState };
    });

    // Update form data when editingTicket changes
    useEffect(() => {
      if (isEdit && editingTicket) {
        setFormData({ ...editingTicket });
      }
    }, [isEdit, editingTicket]);

    // Safe package filtering based on selected event
    const filteredPackages = packages
      .filter((pkg) => !formData?.event || pkg?.event === formData.event)
      .reduce((unique, pkg) => {
        // Check if we already have this package type
        const exists = unique.find(item => item.package_type === pkg.package_type);
        if (!exists) {
          unique.push(pkg);
        }
        return unique;
      }, []);

    const handleFormSubmit = async (formData) => {
      if (isEdit) {
        await handleEditTicket(formData);
      } else {
        await handleAddTicket(formData);
      }
    };

    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!isEdit) {
              setFormData({ ...initialTicketState });
            }
            setEditingTicket(null);
          }
          onOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          {isEdit ? (
            <TicketForm
              formData={formData}
              setFormData={setFormData}
              events={events}
              packages={packages}
              filteredPackages={filteredPackages}
              handleSubmit={handleFormSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isLoading}
            />
          ) : (
            <AddTicketForm
              formData={formData}
              setFormData={setFormData}
              events={events}
              packages={packages}
              filteredPackages={filteredPackages}
              handleSubmit={handleFormSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isAdding}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Add bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTickets(currentItems.map((ticket) => ticket.ticket_id));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId, checked) => {
    if (checked) {
      setSelectedTickets((prev) => [...prev, ticketId]);
    } else {
      setSelectedTickets((prev) => prev.filter((id) => id !== ticketId));
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedTickets([]); // Clear selection when toggling mode
  };

  // Add bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) return;

    setIsBulkDeleting(true);
    try {
      toast.loading(`Deleting ${selectedTickets.length} tickets...`);

      for (const ticketId of selectedTickets) {
        await api.delete(`New%20Stock%20-%20tickets/ticket_id/${ticketId}`);
      }

      toast.dismiss();
      toast.success(`${selectedTickets.length} ticket(s) deleted successfully!`);
      setSelectedTickets([]);

      const res = await api.get("New%20Stock%20-%20tickets");
      setStock(res.data);
    } catch (error) {
      console.error("Failed to delete tickets:", error);
      toast.dismiss();
      toast.error("Failed to delete some tickets");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading inventory...
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={filters.sport}
              onValueChange={(value) => {
                setFilters({ ...filters, sport: value, event: "all" });
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Sport" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueSports().map((sport) => (
                  <SelectItem key={sport.value} value={sport.value}>
                    {sport.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-[300px]">
              <Combobox
                options={getFilteredEvents()}
                value={filters.event}
                onChange={(value) => setFilters({ ...filters, event: value })}
                placeholder="Search for an event..."
                disabled={filters.sport === "all"}
              />
            </div>
            <Select
              value={filters.supplier}
              onValueChange={(value) => setFilters({ ...filters, supplier: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Supplier" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueSuppliers().map((supplier) => (
                  <SelectItem key={supplier.value} value={supplier.value}>
                    {supplier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Filter className="h-4 w-4" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(filters.status).map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setFilters({
                        ...filters,
                        status: { ...filters.status, [key]: checked },
                      })
                    }
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                {sortColumns.map(col => (
                  <DropdownMenuItem
                    key={col.value}
                    onClick={() => setSortColumn(col.value)}
                    className={sortColumn === col.value ? "font-semibold text-primary" : ""}
                  >
                    {col.label} {sortColumn === col.value && "✓"}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Direction</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSortDirection("asc")}
                  className={sortDirection === "asc" ? "font-semibold text-primary" : ""}
                >
                  Ascending {sortDirection === "asc" && "▲"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortDirection("desc")}
                  className={sortDirection === "desc" ? "font-semibold text-primary" : ""}
                >
                  Descending {sortDirection === "desc" && "▼"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground">Sorted by <span className="font-medium">{sortColumns.find(c => c.value === sortColumn)?.label}</span> ({sortDirection === "asc" ? "A-Z" : "Z-A"})</span>
          </div>
          <div className="flex gap-4 items-center">
            {isSelectionMode && selectedTickets.length > 0 && (
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
                    Delete Selected ({selectedTickets.length})
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
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Ticket
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              {isSelectionMode && (
                <TableHead className="w-[50px] text-xs py-2">
                  <Checkbox
                    checked={selectedTickets.length === currentItems.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Ticket Name</TableHead>
              <TableHead className="text-xs py-2">Supplier</TableHead>
              <TableHead className="text-xs py-2">Reference</TableHead>
              <TableHead className="text-xs py-2">Stock</TableHead>
              <TableHead className="text-xs py-2">Used</TableHead>
              <TableHead className="text-xs py-2">Remaining</TableHead>
              <TableHead className="text-xs py-2">Unit Cost (Local)</TableHead>
              <TableHead className="text-xs py-2">Unit Cost (GBP)</TableHead>
              <TableHead className="text-xs py-2">Status</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.ticket_id} className="hover:bg-muted/50">
                {isSelectionMode && (
                  <TableCell className="text-xs py-1.5">
                    <Checkbox
                      checked={selectedTickets.includes(item.ticket_id)}
                      onCheckedChange={(checked) =>
                        handleSelectTicket(item.ticket_id, checked)
                      }
                      aria-label={`Select ${item.ticket_name}`}
                      className="h-4 w-4"
                    />
                  </TableCell>
                )}
                <TableCell className="text-xs py-1.5 font-medium">{item.event}</TableCell>
                <TableCell className="text-xs py-1.5">{item.ticket_name}</TableCell>
                <TableCell className="text-xs py-1.5">{item.supplier}</TableCell>
                <TableCell className="text-xs py-1.5">{item.ref}</TableCell>
                <TableCell className="text-xs py-1.5">{item.actual_stock}</TableCell>
                <TableCell className="text-xs py-1.5">{item.used}</TableCell>
                <TableCell className="text-xs py-1.5">
                  <Badge
                    variant="outline"
                    className={`font-medium ${
                      item.remaining === "purchased_to_order"
                        ? "bg-info/10"
                        : Number(item.remaining) < 5
                        ? "bg-primary/10"
                        : Number(item.remaining) < 10
                        ? "bg-warning/10"
                        : "bg-success/10"
                    }`}
                  >
                    {item.remaining === "purchased_to_order" ? "PTO" : item.remaining}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  {item["unit_cost_(local)"] ? `${item["currency_(bought_in)"]} ${Number(item["unit_cost_(local)"]).toFixed(2)}` : "-"}
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  {item["unit_cost_(gbp)"] ? `£${Number(item["unit_cost_(gbp)"]).toFixed(2)}` : "-"}
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <div className="flex items-center gap-1">
                    {item.ordered && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Ordered
                      </Badge>
                    )}
                    {item.paid && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Paid
                      </Badge>
                    )}
                    {item.tickets_received && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Received
                      </Badge>
                    )}
                    {item.is_provsional && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Provisional
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingTicket(item);
                        setIsEditDialogOpen(true);
                      }}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTicket(item.ticket_id)}
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredStock.length)}{" "}
          of {filteredStock.length} items
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

            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                )}
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

      {/* Add Dialog */}
      <TicketDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
        isLoading={isAdding}
      />

      {/* Edit Dialog */}
      <TicketDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        ticket={editingTicket}
        isLoading={isEditing}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setShowDeleteConfirm(false);
            setTicketToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] max-h-[90vh] overflow-y-auto">
          {isDeleting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-[100]">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-destructive/20"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-destructive border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-lg font-medium text-destructive">
                  Deleting Ticket...
                </p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your request
                </p>
              </div>
            </div>
          )}
          <div
            className={`${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
              <AlertDialogDescription className="text-destructive mb-6">
                Are you sure you want to delete this ticket? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full border-2 border-white/20"></div>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog
        open={showSuccessDialog}
        onOpenChange={async (open) => {
          if (!open) {
            // When dialog closes, fetch the latest tickets
            try {
              const [stockRes] = await Promise.all([
                api.get("Stock%20-%20tickets"),
              ]);
              setStock(stockRes.data);
            } catch (error) {
              console.error("Failed to fetch tickets:", error);
            }
          }
          setShowSuccessDialog(open);
        }}
      >
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
              {selectedTickets.length} selected ticket(s).
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

export { TicketTable };
