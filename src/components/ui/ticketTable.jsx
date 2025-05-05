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
import { CheckCircle2, XCircle, Plus, Trash2, Search, Filter, Pencil, Loader2 } from "lucide-react";
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

function TicketTable() {
  const [stock, setStock] = useState([]);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const itemsPerPage = 10;

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
    }
  });

  // Form state
  const initialTicketState = {
    event: "",
    package_type: "",
    ticket_name: "",
    supplier: "",
    ref: "",
    actual_stock: 0,
    currency_bought_in: "EUR",
    total_cost_local: 0,
    is_provsional: false,
    ordered: false,
    paid: false,
    tickets_received: false,
    markup: "0%",
    event_days: "",
    ticket_type: "",
    video_wall: false,
    covered_seat: false,
    numbered_seat: false,
    delivery_days: "",
    ticket_description: "",
    ticket_image_1: "",
    ticket_image_2: ""
  };
  const [newTicket, setNewTicket] = useState(initialTicketState);

  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [cellValue, setCellValue] = useState("");

  // Field mappings for the API
  const fieldMappings = {
    event: 'Event',
    package_type: 'Package Type',
    ticket_name: 'Ticket Name',
    supplier: 'Supplier',
    ref: 'Ref',
    actual_stock: 'Actual stock',
    used: 'Used',
    currency_bought_in: 'Currency (Bought in)',
    total_cost_local: 'Total Cost  (Local)',
    is_provsional: 'Is Provsional',
    ordered: 'Ordered',
    paid: 'Paid',
    tickets_received: 'Tickets Received',
    markup: 'Markup',
    event_days: 'Event Days',
    ticket_type: 'Ticket Type',
    video_wall: 'Video Wall',
    covered_seat: 'Covered Seat',
    numbered_seat: 'Numbered Seat',
    delivery_days: 'Delivery days',
    ticket_description: 'Ticket Description',
    ticket_image_1: 'Ticket image 1',
    ticket_image_2: 'Ticket Image 2'
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [stockRes, eventsRes, packagesRes] = await Promise.all([
        api.get("Stock%20-%20tickets"),
        api.get("event"),
        api.get("packages")
      ]);
      
      // Ensure we have valid arrays with required properties
      const validEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      const validPackages = Array.isArray(packagesRes.data) ? packagesRes.data : [];
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

  // Helper function to safely get event value and display
  const getEventValue = (event) => {
    if (!event) return "unknown";
    return event.event_id || "unknown";
  };

  const getEventDisplay = (event) => {
    if (!event) return "Unknown Event";
    return `${event.event}`;
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

  // Get unique events from stock data
  const getUniqueEvents = () => {
    const uniqueEvents = [...new Set(stock.map(item => item.event))];
    return uniqueEvents.filter(event => event); // Filter out any undefined/null values
  };

  // Get unique suppliers for filter
  const getUniqueSuppliers = () => {
    const uniqueSuppliers = [...new Set(stock.map(item => item.supplier))];
    return uniqueSuppliers.filter(supplier => supplier); // Filter out any undefined/null values
  };

  // Get unique sports from events data
  const getUniqueSports = () => {
    const uniqueSports = [...new Set(events.map(event => event.sport))];
    return uniqueSports.filter(sport => sport); // Filter out any undefined/null values
  };

  // Filter functions
  const filterStock = (items) => {
    return items.filter(item => {
      // Search filter
      const searchMatch = filters.search === "" || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      // Event filter
      const eventMatch = filters.event === "all" || item.event === filters.event;

      // Sport filter
      const sportMatch = filters.sport === "all" || 
        events.some(event => 
          event.event === item.event && event.sport === filters.sport
        );

      // Supplier filter
      const supplierMatch = filters.supplier === "all" || item.supplier === filters.supplier;

      // Status filters
      const statusMatch = 
        (!filters.status.ordered || item.ordered) &&
        (!filters.status.paid || item.paid) &&
        (!filters.status.received || item.tickets_received) &&
        (!filters.status.provisional || item.is_provsional);

      return searchMatch && eventMatch && sportMatch && supplierMatch && statusMatch;
    });
  };

  // Add ticket
  const handleAddTicket = async (formData) => {
    try {
      setIsAdding(true);
      // Calculate remaining stock
      const remaining = formData.actual_stock - formData.used;
      
      // Create the ticket data with the correct field mappings
      const ticketData = {
        ...formData,
        remaining,
        // Map the fields to match the API's expected format
        event: formData.event,
        package_type: formData.package_type,
        ticket_name: formData.ticket_name,
        supplier: formData.supplier,
        ref: formData.ref,
        actual_stock: formData.actual_stock,
        used: formData.used,
        currency_bought_in: formData.currency_bought_in,
        total_cost_local: formData.total_cost_local,
        is_provsional: formData.is_provsional,
        ordered: formData.ordered,
        paid: formData.paid,
        tickets_received: formData.tickets_received,
        markup: formData.markup,
        event_days: formData.event_days,
        ticket_type: formData.ticket_type,
        video_wall: formData.video_wall,
        covered_seat: formData.covered_seat,
        numbered_seat: formData.numbered_seat,
        delivery_days: formData.delivery_days,
        ticket_description: formData.ticket_description,
        ticket_image_1: formData.ticket_image_1,
        ticket_image_2: formData.ticket_image_2
      };

      await api.post("Stock%20-%20tickets", ticketData);
      
      setSuccessMessage("Ticket added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add ticket:", error);
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
            api.get("Stock%20-%20tickets")
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
      await api.delete(`Stock - tickets/ticket_id/${ticketToDelete}`);
      
      // Update the stock state directly instead of refreshing
      setStock(prevStock => prevStock.filter(ticket => ticket.ticket_id !== ticketToDelete));
      
      setSuccessMessage("Ticket deleted successfully!");
      setShowSuccessDialog(true);
      
      // Clean up states after successful deletion
      setShowDeleteConfirm(false);
      setTicketToDelete(null);
      setIsDeleting(false);
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error("Failed to delete ticket. Please try again.");
      setShowDeleteConfirm(false);
      setTicketToDelete(null);
      setIsDeleting(false);
    }
  };

  // Update ticket
  const handleEditTicket = async (changedFields) => {
    try {
      setIsEditing(true);
      console.log('Starting ticket edit process...');
      console.log('Changed fields:', changedFields);
      
      if (Object.keys(changedFields).length === 0) {
        console.log('No changes detected');
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        setEditingTicket(null);
        return;
      }

      // Get the ticket ID from the current editing ticket
      const ticketId = editingTicket.ticket_id;
      console.log('Making API PUT request...');
      console.log('Endpoint:', `/Stock - tickets/ticket_id/${ticketId}`);
      console.log('Request body:', changedFields);

      const response = await api.put(`/Stock - tickets/ticket_id/${ticketId}`, changedFields);
      console.log('API response:', response);

      setSuccessMessage("Ticket updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      setEditingTicket(null);
      console.log('Refreshing data...');
      fetchInitialData(); // Refresh all data
    } catch (error) {
      console.error("Failed to update ticket:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error("Failed to update ticket. Please try again.");
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
      const ticket = stock.find(t => t.ticket_id === rowId);
      if (!ticket) return;

      // Only update the specific field
      const updateData = {
        [field]: cellValue
      };

      // If updating stock or used, calculate remaining
      if (field === 'actual_stock' || field === 'used') {
        const newStock = field === 'actual_stock' ? cellValue : ticket.actual_stock;
        const newUsed = field === 'used' ? cellValue : ticket.used;
        updateData.remaining = newStock - newUsed;
      }

      // If updating total cost or stock, calculate unit cost
      if (field === 'total_cost_local' || field === 'actual_stock') {
        const newTotal = field === 'total_cost_local' ? cellValue : ticket.total_cost_local;
        const newStock = field === 'actual_stock' ? cellValue : ticket.actual_stock;
        updateData['unit_cost_(gbp)'] = newStock > 0 ? (newTotal / newStock).toFixed(2) : 0;
      }

      console.log('Updating field:', field, 'with value:', cellValue);
      await api.put(`Stock%20-%20tickets/${rowId}`, updateData);
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
  const filteredStock = filterStock(stock).reverse();
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
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleFieldUpdate = async (ticketId, field, value) => {
    try {
      console.log('Updating single field:', { ticketId, field, value });
      
      // Map the field to the correct column name
      const columnMappings = {
        event: 'Event',
        package_type: 'Package Type',
        ticket_name: 'Ticket Name',
        supplier: 'Supplier',
        ref: 'Ref',
        actual_stock: 'Actual stock',
        used: 'Used',
        currency_bought_in: 'Currency (Bought in)',
        total_cost_local: 'Total Cost  (Local)',
        is_provsional: 'Is Provsional',
        ordered: 'Ordered',
        paid: 'Paid',
        tickets_received: 'Tickets Received',
        markup: 'Markup',
        event_days: 'Event Days',
        ticket_type: 'Ticket Type',
        video_wall: 'Video Wall',
        covered_seat: 'Covered Seat',
        numbered_seat: 'Numbered Seat',
        delivery_days: 'Delivery days',
        ticket_description: 'Ticket Description',
        ticket_image_1: 'Ticket image 1',
        ticket_image_2: 'Ticket Image 2'
      };

      const columnName = columnMappings[field];
      if (!columnName) {
        throw new Error(`Invalid field: ${field}`);
      }

      // Create the update payload with the column name and value
      const updateData = {
        column: columnName,
        value: value
      };

      // Properly encode the URL
      const encodedEndpoint = encodeURIComponent('Stock - tickets');
      console.log('Making API PUT request for single cell update...');
      console.log('Endpoint:', `/${encodedEndpoint}/ticket_id/${ticketId}`);
      console.log('Request body:', updateData);

      const response = await api.put(`/${encodedEndpoint}/ticket_id/${ticketId}`, updateData);
      console.log('API response:', response);

      // Update the local state immediately
      setStock(prevStock => 
        prevStock.map(ticket => {
          if (ticket.ticket_id === ticketId) {
            // Create a new ticket object with the updated field
            const updatedTicket = { ...ticket, [field]: value };
            
            // If we're updating stock or used, recalculate remaining
            if (field === 'actual_stock' || field === 'used') {
              const newStock = field === 'actual_stock' ? value : ticket.actual_stock;
              const newUsed = field === 'used' ? value : ticket.used;
              updatedTicket.remaining = newStock - newUsed;
            }
            
            // If we're updating total cost or stock, recalculate unit cost
            if (field === 'total_cost_local' || field === 'actual_stock') {
              const newTotal = field === 'total_cost_local' ? value : ticket.total_cost_local;
              const newStock = field === 'actual_stock' ? value : ticket.actual_stock;
              updatedTicket['unit_cost_(gbp)'] = newStock > 0 ? (newTotal / newStock).toFixed(2) : 0;
            }
            
            return updatedTicket;
          }
          return ticket;
        })
      );

      // If we're editing a ticket in the dialog, update that too
      if (editingTicket && editingTicket.ticket_id === ticketId) {
        setEditingTicket(prev => {
          const updated = { ...prev, [field]: value };
          
          // Recalculate derived fields if needed
          if (field === 'actual_stock' || field === 'used') {
            const newStock = field === 'actual_stock' ? value : prev.actual_stock;
            const newUsed = field === 'used' ? value : prev.used;
            updated.remaining = newStock - newUsed;
          }
          
          if (field === 'total_cost_local' || field === 'actual_stock') {
            const newTotal = field === 'total_cost_local' ? value : prev.total_cost_local;
            const newStock = field === 'actual_stock' ? value : prev.actual_stock;
            updated['unit_cost_(gbp)'] = newStock > 0 ? (newTotal / newStock).toFixed(2) : 0;
          }
          
          return updated;
        });
      }

      toast.success("Field updated successfully");
    } catch (error) {
      console.error("Failed to update field:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(`Failed to update field: ${error.response?.data?.error || error.message}`);
    }
  };

  const TicketForm = ({ formData, setFormData, events, packages, filteredPackages, handleSubmit, onCancel, isLoading = false }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = (field, value) => {
      const newErrors = { ...errors };
      
      switch (field) {
        case 'ticket_name':
          if (!value || value.trim() === '') {
            newErrors[field] = 'Ticket name is required';
          } else {
            delete newErrors[field];
          }
          break;
        case 'actual_stock':
          if (value === '' || isNaN(value) || value < 0) {
            newErrors[field] = 'Stock must be a positive number';
          } else {
            delete newErrors[field];
          }
          break;
        case 'total_cost_local':
          if (value === '' || isNaN(value) || value < 0) {
            newErrors[field] = 'Total cost must be a positive number';
          } else {
            delete newErrors[field];
          }
          break;
        case 'markup':
          const numericValue = parseFloat(value);
          if (isNaN(numericValue) || numericValue < 0) {
            newErrors[field] = 'Markup must be a positive number';
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

    const handleFieldChange = async (field, value) => {
      // Validate the field before updating
      if (validateField(field, value)) {
        try {
          setIsSubmitting(true);
          console.log(`Field ${field} changed to:`, value);
          
          // Update the form data
          setFormData(prev => ({ ...prev, [field]: value }));
          
          // Send the update to the backend
          await handleFieldUpdate(formData.ticket_id, field, value);
          
          // Clear any previous errors for this field
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        } catch (error) {
          console.error(`Error updating ${field}:`, error);
          setErrors(prev => ({
            ...prev,
            [field]: error.response?.data?.error || 'Failed to update field'
          }));
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    const handleBlur = (field, value) => {
      validateField(field, value);
    };

    // Event day options
    const eventDayOptions = [
      "Fri - Sun",
      "Sat - Sun",
      "Thu - Sun",
      "Friday",
      "Saturday",
      "Sunday",
      "Thursday"
    ];

    // Ticket type options
    const ticketTypeOptions = [
      "E-ticket",
      "Collection Ticket",
      "Paper Ticket",
      "App Ticket"
    ];

    // Currency options (common currencies)
    const currencyOptions = [
      "GBP",
      "EUR",
      "USD",
      "AUD",
      "AED",
      "CAD",
      "CHF",
      "CNY",
      "JPY",
      "NZD",
      "SGD"
    ];

    // Format events for Combobox
    const eventOptions = events.map(event => ({
      value: event?.event || "",
      label: event?.event || "Unnamed Event"
    }));

    return (
      <div className="grid gap-6 py-4">
        {/* Event and Package Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event">Event</Label>
            <Combobox
              options={eventOptions}
              value={formData?.event || ""}
              onChange={(value) => handleFieldChange('event', value)}
              onBlur={() => handleBlur('event', formData?.event)}
              placeholder="Search for an event..."
              disabled={isSubmitting}
            />
            {errors.event && <p className="text-sm text-red-500">{errors.event}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="package">Package Type</Label>
            <Select
              value={formData?.package_type || ""}
              onValueChange={(value) => handleFieldChange('package_type', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {filteredPackages.map((pkg) => (
                  <SelectItem 
                    key={pkg?.package_id || crypto.randomUUID()}
                    value={pkg?.package_type || ""}
                  >
                    {pkg?.package_type || "Unnamed Package"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.package_type && <p className="text-sm text-red-500">{errors.package_type}</p>}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Ticket Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket_name">Ticket Name</Label>
              <Input
                id="ticket_name"
                value={formData.ticket_name}
                onChange={(e) => handleFieldChange('ticket_name', e.target.value)}
                onBlur={(e) => handleBlur('ticket_name', e.target.value)}
                placeholder="Enter ticket name"
                disabled={isSubmitting}
                className={errors.ticket_name ? "border-red-500" : ""}
              />
              {errors.ticket_name && <p className="text-sm text-red-500">{errors.ticket_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleFieldChange('supplier', e.target.value)}
                onBlur={(e) => handleBlur('supplier', e.target.value)}
                placeholder="Enter supplier name"
                disabled={isSubmitting}
              />
              {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                value={formData.ref}
                onChange={(e) => handleFieldChange('ref', e.target.value)}
                onBlur={(e) => handleBlur('ref', e.target.value)}
                placeholder="Enter reference"
                disabled={isSubmitting}
              />
              {errors.ref && <p className="text-sm text-red-500">{errors.ref}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="markup">Markup (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="markup"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.markup?.replace('%', '') || 0}
                  onChange={(e) => handleFieldChange('markup', e.target.value)}
                  onBlur={(e) => handleBlur('markup', e.target.value)}
                  className={`w-full ${errors.markup ? "border-red-500" : ""}`}
                  disabled={isSubmitting}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              {errors.markup && <p className="text-sm text-red-500">{errors.markup}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_days">Event Days</Label>
              <Select
                value={formData.event_days}
                onValueChange={(value) => handleFieldChange('event_days', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event days" />
                </SelectTrigger>
                <SelectContent>
                  {eventDayOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_type">Ticket Type</Label>
              <Select
                value={formData.ticket_type}
                onValueChange={(value) => handleFieldChange('ticket_type', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypeOptions.map((option) => (
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
              <Label htmlFor="delivery_days">Delivery Days</Label>
              <Input
                id="delivery_days"
                value={formData.delivery_days}
                onChange={(e) => handleFieldChange('delivery_days', e.target.value)}
                onBlur={(e) => handleBlur('delivery_days', e.target.value)}
                placeholder="Enter delivery days"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_description">Ticket Description</Label>
              <Input
                id="ticket_description"
                value={formData.ticket_description}
                onChange={(e) => handleFieldChange('ticket_description', e.target.value)}
                onBlur={(e) => handleBlur('ticket_description', e.target.value)}
                placeholder="Enter ticket description"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Stock and Cost Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Stock & Cost Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual_stock">Stock</Label>
              <Input
                id="actual_stock"
                type="number"
                min="0"
                value={formData.actual_stock}
                onChange={(e) => handleFieldChange('actual_stock', Number(e.target.value))}
                onBlur={(e) => handleBlur('actual_stock', Number(e.target.value))}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_cost_local">Total Cost (Local)</Label>
              <div className="flex gap-2">
                <Input
                  id="total_cost_local"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total_cost_local}
                  onChange={(e) => handleFieldChange('total_cost_local', Number(e.target.value))}
                  onBlur={(e) => handleBlur('total_cost_local', Number(e.target.value))}
                  className="flex-1"
                  disabled={isSubmitting}
                />
                <Select
                  value={formData.currency_bought_in}
                  onValueChange={(value) => handleFieldChange('currency_bought_in', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Features */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Seat Features</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="video_wall"
                checked={formData?.video_wall || false}
                onCheckedChange={(checked) => handleFieldChange('video_wall', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="video_wall">Video Wall</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="covered_seat"
                checked={formData?.covered_seat || false}
                onCheckedChange={(checked) => handleFieldChange('covered_seat', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="covered_seat">Covered Seat</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="numbered_seat"
                checked={formData?.numbered_seat || false}
                onCheckedChange={(checked) => handleFieldChange('numbered_seat', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="numbered_seat">Numbered Seat</Label>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="ordered"
                checked={formData?.ordered || false}
                onCheckedChange={(checked) => handleFieldChange('ordered', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="ordered">Ordered</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="paid"
                checked={formData?.paid || false}
                onCheckedChange={(checked) => handleFieldChange('paid', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="paid">Paid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="received"
                checked={formData?.tickets_received || false}
                onCheckedChange={(checked) => handleFieldChange('tickets_received', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="received">Received</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="provisional"
                checked={formData?.is_provsional || false}
                onCheckedChange={(checked) => handleFieldChange('is_provsional', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="provisional">Provisional</Label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
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
    );
  };

  const AddTicketForm = ({ formData, setFormData, events, packages, filteredPackages, handleSubmit, onCancel, isLoading = false }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');

    const validateField = (field, value) => {
      const newErrors = { ...errors };
      
      switch (field) {
        case 'ticket_name':
          if (!value || value.trim() === '') {
            newErrors[field] = 'Ticket name is required';
          } else {
            delete newErrors[field];
          }
          break;
        case 'actual_stock':
          if (value === '' || isNaN(value) || value < 0) {
            newErrors[field] = 'Stock must be a positive number';
          } else {
            delete newErrors[field];
          }
          break;
        case 'total_cost_local':
          if (value === '' || isNaN(value) || value < 0) {
            newErrors[field] = 'Total cost must be a positive number';
          } else {
            delete newErrors[field];
          }
          break;
        case 'markup':
          const numericValue = parseFloat(value);
          if (isNaN(numericValue) || numericValue < 0) {
            newErrors[field] = 'Markup must be a positive number';
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

    const handleFormSubmit = async () => {
      try {
        setIsSubmitting(true);
        setSubmitStatus('submitting');
        
        // Ensure markup is properly formatted before submission
        const formattedData = {
          ...formData,
          markup: formData.markup ? `${formData.markup}%` : '0%'
        };
        
        await handleSubmit(formattedData);
        setSubmitStatus('success');
        toast.success("Ticket added successfully!");
        
        // Reset form after successful submission
        setFormData({ ...initialTicketState });
        setSubmitStatus('idle');
        onCancel();
      } catch (error) {
        console.error('Error submitting form:', error);
        setSubmitStatus('error');
        toast.error('Failed to add ticket');
      } finally {
        setIsSubmitting(false);
      }
    };

    // Event day options
    const eventDayOptions = [
      "Fri - Sun",
      "Sat - Sun",
      "Thu - Sun",
      "Friday",
      "Saturday",
      "Sunday",
      "Thursday"
    ];

    // Ticket type options
    const ticketTypeOptions = [
      "E-ticket",
      "Collection Ticket",
      "Paper Ticket",
      "App Ticket"
    ];

    // Currency options (common currencies)
    const currencyOptions = [
      "GBP",
      "EUR",
      "USD",
      "AUD",
      "CAD",
      "CHF",
      "CNY",
      "JPY",
      "NZD",
      "SGD"
    ];

    // Format events for Combobox
    const eventOptions = events.map(event => ({
      value: event?.event || "",
      label: event?.event || "Unnamed Event"
    }));

    // Get unique package types
    const uniquePackages = [...new Set(packages.map(pkg => pkg?.package_type))].filter(Boolean);

    return (
      <div className="grid gap-6 py-4 relative">
        {/* Loading Overlay */}
        {(isSubmitting || isLoading) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-lg font-medium text-primary">Adding Ticket...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process your request</p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className={`${(isSubmitting || isLoading) ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Event and Package Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event">Event</Label>
              <Combobox
                options={eventOptions}
                value={formData?.event || ""}
                onChange={(value) => handleFieldChange('event', value)}
                onBlur={() => handleBlur('event', formData?.event)}
                placeholder="Search for an event..."
                disabled={isSubmitting}
              />
              {errors.event && <p className="text-sm text-red-500">{errors.event}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="package">Package Type</Label>
              <Select
                value={formData?.package_type || ""}
                onValueChange={(value) => handleFieldChange('package_type', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {uniquePackages.map((pkgType) => (
                    <SelectItem 
                      key={pkgType}
                      value={pkgType}
                    >
                      {pkgType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.package_type && <p className="text-sm text-red-500">{errors.package_type}</p>}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Ticket Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_name">Ticket Name</Label>
                <Input
                  id="ticket_name"
                  value={formData.ticket_name}
                  onChange={(e) => handleFieldChange('ticket_name', e.target.value)}
                  onBlur={(e) => handleBlur('ticket_name', e.target.value)}
                  placeholder="Enter ticket name"
                  disabled={isSubmitting}
                  className={errors.ticket_name ? "border-red-500" : ""}
                />
                {errors.ticket_name && <p className="text-sm text-red-500">{errors.ticket_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleFieldChange('supplier', e.target.value)}
                  onBlur={(e) => handleBlur('supplier', e.target.value)}
                  placeholder="Enter supplier name"
                  disabled={isSubmitting}
                />
                {errors.supplier && <p className="text-sm text-red-500">{errors.supplier}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ref">Reference</Label>
                <Input
                  id="ref"
                  value={formData.ref}
                  onChange={(e) => handleFieldChange('ref', e.target.value)}
                  onBlur={(e) => handleBlur('ref', e.target.value)}
                  placeholder="Enter reference"
                  disabled={isSubmitting}
                />
                {errors.ref && <p className="text-sm text-red-500">{errors.ref}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup">Markup (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="markup"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.markup?.replace('%', '') || 0}
                    onChange={(e) => handleFieldChange('markup', e.target.value)}
                    onBlur={(e) => handleBlur('markup', e.target.value)}
                    className={`w-full ${errors.markup ? "border-red-500" : ""}`}
                    disabled={isSubmitting}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                {errors.markup && <p className="text-sm text-red-500">{errors.markup}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_days">Event Days</Label>
                <Select
                  value={formData.event_days}
                  onValueChange={(value) => handleFieldChange('event_days', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event days" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventDayOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_type">Ticket Type</Label>
                <Select
                  value={formData.ticket_type}
                  onValueChange={(value) => handleFieldChange('ticket_type', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketTypeOptions.map((option) => (
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
                <Label htmlFor="delivery_days">Delivery Days</Label>
                <Input
                  id="delivery_days"
                  value={formData.delivery_days}
                  onChange={(e) => handleFieldChange('delivery_days', e.target.value)}
                  onBlur={(e) => handleBlur('delivery_days', e.target.value)}
                  placeholder="Enter delivery days"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_description">Ticket Description</Label>
                <Input
                  id="ticket_description"
                  value={formData.ticket_description}
                  onChange={(e) => handleFieldChange('ticket_description', e.target.value)}
                  onBlur={(e) => handleBlur('ticket_description', e.target.value)}
                  placeholder="Enter ticket description"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Stock and Cost Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Stock & Cost Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual_stock">Stock</Label>
                <Input
                  id="actual_stock"
                  type="number"
                  min="0"
                  value={formData.actual_stock}
                  onChange={(e) => handleFieldChange('actual_stock', Number(e.target.value))}
                  onBlur={(e) => handleBlur('actual_stock', Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_cost_local">Total Cost (Local)</Label>
                <div className="flex gap-2">
                  <Input
                    id="total_cost_local"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_cost_local}
                    onChange={(e) => handleFieldChange('total_cost_local', Number(e.target.value))}
                    onBlur={(e) => handleBlur('total_cost_local', Number(e.target.value))}
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Select
                    value={formData.currency_bought_in}
                    onValueChange={(value) => handleFieldChange('currency_bought_in', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Seat Features */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Seat Features</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="video_wall"
                  checked={formData?.video_wall || false}
                  onCheckedChange={(checked) => handleFieldChange('video_wall', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="video_wall">Video Wall</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="covered_seat"
                  checked={formData?.covered_seat || false}
                  onCheckedChange={(checked) => handleFieldChange('covered_seat', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="covered_seat">Covered Seat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="numbered_seat"
                  checked={formData?.numbered_seat || false}
                  onCheckedChange={(checked) => handleFieldChange('numbered_seat', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="numbered_seat">Numbered Seat</Label>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ordered"
                  checked={formData?.ordered || false}
                  onCheckedChange={(checked) => handleFieldChange('ordered', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="ordered">Ordered</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="paid"
                  checked={formData?.paid || false}
                  onCheckedChange={(checked) => handleFieldChange('paid', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="paid">Paid</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="received"
                  checked={formData?.tickets_received || false}
                  onCheckedChange={(checked) => handleFieldChange('tickets_received', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="received">Received</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="provisional"
                  checked={formData?.is_provsional || false}
                  onCheckedChange={(checked) => handleFieldChange('is_provsional', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="provisional">Provisional</Label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={isSubmitting || submitStatus === 'success' || isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFormSubmit} 
              disabled={isSubmitting || submitStatus === 'success' || isLoading}
              className="min-w-[100px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Added!
                </>
              ) : (
                "Add Ticket"
              )}
            </Button>
          </div>

          {/* Status Message */}
          {submitStatus === 'error' && (
            <div className="text-sm text-red-500 text-center">
              Failed to add ticket. Please try again.
            </div>
          )}
        </div>
      </div>
    );
  };

  const TicketDialog = ({ isOpen, onOpenChange, mode = "add", ticket = null, isLoading = false }) => {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit ? "Edit Ticket" : "Add New Ticket";
    const dialogDescription = isEdit ? "Update the ticket details" : "Fill in the details for the new ticket";
    
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
      .filter(pkg => !formData?.event || pkg?.event === formData.event);

    const handleFormSubmit = async (formData) => {
      if (isEdit) {
        await handleEditTicket(formData);
      } else {
        await handleAddTicket(formData);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          if (!isEdit) {
            setFormData({ ...initialTicketState });
          }
          setEditingTicket(null);
        }
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ticket Inventory</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={filters.sport}
          onValueChange={(value) => setFilters({ ...filters, sport: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {getUniqueSports().map((sport) => (
              <SelectItem 
                key={sport || crypto.randomUUID()}
                value={sport}
              >
                {sport || "Unknown Sport"}
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
            {getUniqueEvents().map((event) => (
              <SelectItem 
                key={event || crypto.randomUUID()}
                value={event}
              >
                {event || "Unnamed Event"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.supplier}
          onValueChange={(value) => setFilters({ ...filters, supplier: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {getUniqueSuppliers().map((supplier) => (
              <SelectItem 
                key={supplier || crypto.randomUUID()}
                value={supplier || "unknown"}
              >
                {supplier || "Unknown Supplier"}
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
                    status: { ...filters.status, [key]: checked } 
                  })
                }
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Ticket Name</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Unit Cost (GBP)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              const isEditing = editingCell.rowId === item.ticket_id;
              const remaining = item.remaining;
              const isPTO = remaining === 'purchased_to_order';
              
              return (
                <TableRow key={item.ticket_id}>
                  <TableCell className="font-medium">{item.event}</TableCell>
                  <TableCell>
                    {isEditing && editingCell.field === 'ticket_name' ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.ticket_id, 'ticket_name')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(item.ticket_id, 'ticket_name');
                          if (e.key === 'Escape') handleCellCancel();
                        }}
                        autoFocus
                      />
                    ) : (
                      <div onClick={() => handleCellEdit(item.ticket_id, 'ticket_name', item.ticket_name)}>
                        {item.ticket_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && editingCell.field === 'supplier' ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.ticket_id, 'supplier')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(item.ticket_id, 'supplier');
                          if (e.key === 'Escape') handleCellCancel();
                        }}
                        autoFocus
                      />
                    ) : (
                      <div onClick={() => handleCellEdit(item.ticket_id, 'supplier', item.supplier)}>
                        {item.supplier}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && editingCell.field === 'ref' ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.ticket_id, 'ref')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(item.ticket_id, 'ref');
                          if (e.key === 'Escape') handleCellCancel();
                        }}
                        autoFocus
                      />
                    ) : (
                      <div onClick={() => handleCellEdit(item.ticket_id, 'ref', item.ref)}>
                        {item.ref}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && editingCell.field === 'actual_stock' ? (
                      <Input
                        type="number"
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.ticket_id, 'actual_stock')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(item.ticket_id, 'actual_stock');
                          if (e.key === 'Escape') handleCellCancel();
                        }}
                        autoFocus
                      />
                    ) : (
                      <div onClick={() => handleCellEdit(item.ticket_id, 'actual_stock', item.actual_stock)}>
                        {item.actual_stock}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && editingCell.field === 'used' ? (
                      <Input
                        type="number"
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.ticket_id, 'used')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave(item.ticket_id, 'used');
                          if (e.key === 'Escape') handleCellCancel();
                        }}
                        autoFocus
                      />
                    ) : (
                      <div onClick={() => handleCellEdit(item.ticket_id, 'used', item.used)}>
                        {item.used}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${isPTO ? 'text-blue-500' : remaining < 5 ? 'text-red-500' : remaining < 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {isPTO ? 'PTO' : remaining}
                    </div>
                  </TableCell>
                  <TableCell>£{typeof item['unit_cost_(gbp)'] === 'number' ? item['unit_cost_(gbp)'].toFixed(2) : '0.00'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTicket(item);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTicket(item.ticket_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredStock.length)} of {filteredStock.length} items
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === '...' ? (
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
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
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          setShowDeleteConfirm(false);
          setTicketToDelete(null);
        }
      }}>
        <AlertDialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] max-h-[90vh] overflow-y-auto">
          {isDeleting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-[100]">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-destructive/20"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-destructive border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-lg font-medium text-destructive">Deleting Ticket...</p>
                <p className="text-sm text-muted-foreground">Please wait while we process your request</p>
              </div>
            </div>
          )}
          <div className={`${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this ticket? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      <AlertDialog open={showSuccessDialog} onOpenChange={async (open) => {
        if (!open) {
          // When dialog closes, fetch the latest tickets
          try {
            const [stockRes] = await Promise.all([
              api.get("Stock%20-%20tickets")
            ]);
            setStock(stockRes.data);
          } catch (error) {
            console.error("Failed to fetch tickets:", error);
          }
        }
        setShowSuccessDialog(open);
      }}>
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
    </div>
  );
}

export { TicketTable };
