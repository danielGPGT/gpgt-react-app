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
      fetchInitialData(); // Refresh all data
    } catch (error) {
      console.error("Failed to add ticket:", error);
      toast.error("Failed to add ticket. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

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
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error("Failed to delete ticket. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setTicketToDelete(null);
      setIsDeleting(false);
    }
  };

  // Update ticket
  const handleEditTicket = async () => {
    try {
      setIsEditing(true);
      // Get the original ticket data
      const originalTicket = stock.find(t => t.ticket_id === editingTicket.ticket_id);
      
      // Create a diff of only changed fields
      const changedFields = {};
      Object.keys(editingTicket).forEach(key => {
        if (key === 'ticket_id') return; // Skip ticket_id
        if (editingTicket[key] !== originalTicket[key]) {
          changedFields[key] = editingTicket[key];
        }
      });

      // If no fields were changed, show a message and return
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        setEditingTicket(null);
        return;
      }

      // Calculate remaining stock if stock or used fields were changed
      if (changedFields.actual_stock !== undefined || changedFields.used !== undefined) {
        const newStock = changedFields.actual_stock ?? originalTicket.actual_stock;
        const newUsed = changedFields.used ?? originalTicket.used;
        changedFields.remaining = newStock - newUsed;
      }

      // Calculate unit cost if total cost or stock was changed
      if (changedFields.total_cost_local !== undefined || changedFields.actual_stock !== undefined) {
        const newTotal = changedFields.total_cost_local ?? originalTicket.total_cost_local;
        const newStock = changedFields.actual_stock ?? originalTicket.actual_stock;
        changedFields['unit_cost_(gbp)'] = newStock > 0 ? (newTotal / newStock).toFixed(2) : 0;
      }

      // Map the fields to match the API's expected format
      const mappedFields = {};
      Object.entries(changedFields).forEach(([key, value]) => {
        if (fieldMappings[key]) {
          mappedFields[fieldMappings[key]] = value;
        }
      });

      // Update the ticket
      await api.put(`Stock%20-%20tickets/ticket_id/${editingTicket.ticket_id}`, mappedFields);

      setSuccessMessage("Ticket updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      setEditingTicket(null);
      fetchInitialData(); // Refresh all data
    } catch (error) {
      console.error("Failed to update ticket:", error);
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

  const TicketForm = ({ formData, setFormData, events, packages, filteredPackages, handleSubmit, onCancel, isLoading = false }) => {
    const [editingField, setEditingField] = useState(null);
    const [fieldValue, setFieldValue] = useState("");

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

    const handleFieldEdit = (field, value) => {
      setEditingField(field);
      setFieldValue(value);
    };

    const handleFieldSave = (field) => {
      // Handle numeric fields
      if (['actual_stock', 'used', 'total_cost_local', 'unit_cost_gbp'].includes(field)) {
        setFormData(prev => ({
          ...prev,
          [field]: Number(fieldValue) || 0
        }));
      }
      // Handle boolean fields
      else if (['is_provsional', 'ordered', 'paid', 'tickets_received', 'video_wall', 'covered_seat', 'numbered_seat'].includes(field)) {
        setFormData(prev => ({
          ...prev,
          [field]: Boolean(fieldValue)
        }));
      }
      // Handle all other fields
      else {
        setFormData(prev => ({
          ...prev,
          [field]: fieldValue
        }));
      }

      // Calculate unit cost when total cost or stock changes
      if (field === 'total_cost_local' || field === 'actual_stock') {
        const unitCostGBP = formData.actual_stock > 0 
          ? (formData.total_cost_local / formData.actual_stock).toFixed(2)
          : 0;
        setFormData(prev => ({
          ...prev,
          unit_cost_gbp: parseFloat(unitCostGBP)
        }));
      }

      setEditingField(null);
      setFieldValue("");
    };

    const handleFieldCancel = () => {
      setEditingField(null);
      setFieldValue("");
    };

    return (
      <div className="grid gap-6 py-4">
        {/* Event and Package Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event">Event</Label>
            <Combobox
              options={eventOptions}
              value={formData?.event || ""}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  event: value,
                  package_type: '' // Reset package type when event changes
                }));
              }}
              placeholder="Search for an event..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="package">Package Type</Label>
            <Select
              value={formData?.package_type || ""}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  package_type: value
                }));
              }}
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
                onChange={(e) => setFormData(prev => ({ ...prev, ticket_name: e.target.value }))}
                placeholder="Enter ticket name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Enter supplier name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                value={formData.ref}
                onChange={(e) => setFormData(prev => ({ ...prev, ref: e.target.value }))}
                placeholder="Enter reference"
              />
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
                  onChange={(e) => setFormData(prev => ({ ...prev, markup: `${e.target.value}%` }))}
                  className="w-full"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_days">Event Days</Label>
              <Select
                value={formData.event_days}
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_days: value }))}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, ticket_type: value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_days: e.target.value }))}
                placeholder="Enter delivery days"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_description">Ticket Description</Label>
              <Input
                id="ticket_description"
                value={formData.ticket_description}
                onChange={(e) => setFormData(prev => ({ ...prev, ticket_description: e.target.value }))}
                placeholder="Enter ticket description"
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
                onChange={(e) => setFormData(prev => ({ ...prev, actual_stock: Number(e.target.value) }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, total_cost_local: Number(e.target.value) }))}
                  className="flex-1"
                />
                <Select
                  value={formData.currency_bought_in}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency_bought_in: value }))}
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
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, video_wall: checked }))}
              />
              <Label htmlFor="video_wall">Video Wall</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="covered_seat"
                checked={formData?.covered_seat || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, covered_seat: checked }))}
              />
              <Label htmlFor="covered_seat">Covered Seat</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="numbered_seat"
                checked={formData?.numbered_seat || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, numbered_seat: checked }))}
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
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ordered: checked }))}
              />
              <Label htmlFor="ordered">Ordered</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="paid"
                checked={formData?.paid || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paid: checked }))}
              />
              <Label htmlFor="paid">Paid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="received"
                checked={formData?.tickets_received || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tickets_received: checked }))}
              />
              <Label htmlFor="received">Received</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="provisional"
                checked={formData?.is_provsional || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_provsional: checked }))}
              />
              <Label htmlFor="provisional">Provisional</Label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TicketDialog = ({ isOpen, onOpenChange, mode = "add", ticket = null, isLoading = false }) => {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit ? "Edit Ticket" : "Add New Ticket";
    const dialogDescription = isEdit ? "Update the ticket details" : "Fill in the details for the new ticket";
    const buttonText = isEdit ? "Update Ticket" : "Add Ticket";
    
    // Initialize form data with the current ticket data
    const [formData, setFormData] = useState(() => {
      if (isEdit && editingTicket) {
        return { ...editingTicket };
      }
      return { ...initialTicketState };
    });

    // Update form data when editingTicket or newTicket changes
    useEffect(() => {
      if (isEdit && editingTicket) {
        setFormData({ ...editingTicket });
      } else if (!isEdit) {
        setFormData({ ...initialTicketState });
      }
    }, [isEdit, editingTicket]);

    // Safe package filtering based on selected event
    const filteredPackages = packages
      .filter(pkg => !formData?.event || pkg?.event === formData.event);

    const handleFormSubmit = () => {
      console.log('Submitting form with data:', formData);
      
      // Create a clean copy of the form data without ticket_id for new tickets
      const cleanFormData = { ...formData };
      if (!isEdit) {
        delete cleanFormData.ticket_id;
      }

      if (isEdit) {
        setEditingTicket(cleanFormData);
        handleEditTicket();
      } else {
        // Pass form data directly to handleAddTicket
        handleAddTicket(cleanFormData);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
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
          <DialogFooter className="sticky bottom-0 bg-background border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                buttonText
              )}
            </Button>
          </DialogFooter>
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
          <TableHeader>
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
                          const eventObj = events.find(e => e.event === item.event);
                          openEditDialog({
                            ...item,
                            event_id: eventObj?.event_id
                          });
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
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
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
    </div>
  );
}

export { TicketTable };
