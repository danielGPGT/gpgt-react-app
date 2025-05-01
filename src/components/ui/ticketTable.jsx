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
import { CheckCircle2, XCircle, Plus, Trash2, Search, Filter, Pencil } from "lucide-react";
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
    ticket_id: "",
    event_id: "",
    event: "",
    package_id: "",
    package_type: "",
    ticket_name: "",
    supplier: "",
    ref: "",
    actual_stock: 0,
    used: 0,
    remaining: 0,
    "currency_(bought_in)": "EUR",
    "unit_cost_(local)": 0,
    "unit_cost_(gbp)": 0,
    "total_cost_(local)": 0,
    "total_cost_(gbp)": 0,
    is_provsional: false,
    ordered: false,
    paid: false,
    tickets_received: false,
    markup: "0%"
  };
  const [newTicket, setNewTicket] = useState(initialTicketState);

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

  const handleAddTicket = async () => {
    try {
      // Calculate remaining stock
      const remaining = newTicket.actual_stock - newTicket.used;
      
      // Create the ticket data
      const ticketData = {
        ...newTicket,
        remaining,
        ticket_id: crypto.randomUUID()
      };

      await api.post("Stock%20-%20tickets", ticketData);
      toast.success("Ticket added successfully");
      setIsAddDialogOpen(false);
      fetchInitialData(); // Refresh all data
      
      // Reset form
      setNewTicket(initialTicketState);
    } catch (error) {
      console.error("Failed to add ticket:", error);
      toast.error("Failed to add ticket");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      await api.delete(`Stock%20-%20tickets/${ticketId}`);
      toast.success("Ticket deleted successfully");
      fetchInitialData(); // Refresh all data
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      toast.error("Failed to delete ticket");
    }
  };

  const handleEditTicket = async () => {
    try {
      // Calculate remaining stock
      const remaining = editingTicket.actual_stock - editingTicket.used;
      
      // Create the ticket data
      const ticketData = {
        ...editingTicket,
        remaining
      };

      await api.put(`Stock%20-%20tickets/${editingTicket.ticket_id}`, ticketData);
      toast.success("Ticket updated successfully");
      setIsEditDialogOpen(false);
      setEditingTicket(null);
      fetchInitialData(); // Refresh all data
    } catch (error) {
      console.error("Failed to update ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  // Function to open edit dialog with proper initialization
  const openEditDialog = (ticket) => {
    // Find the corresponding event from events array
    const eventObj = events.find(e => e.event === ticket.event);
    
    // Ensure all required fields are present and properly initialized
    const preparedTicket = {
      ...initialTicketState,
      ...ticket,
      // Map the event data correctly
      event_id: eventObj?.event_id || "",
      event: ticket.event || "",
      // Package data is already in the ticket object
      package_id: ticket.package_id || "",
      package_type: ticket.package_type || ""
    };
    setEditingTicket(preparedTicket);
    setIsEditDialogOpen(true);
  };

  // Apply filters and calculate pagination
  const filteredStock = filterStock(stock);
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

  const TicketDialog = ({ isOpen, onOpenChange, mode = "add", ticket = null }) => {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit ? "Edit Ticket" : "Add New Ticket";
    const dialogDescription = isEdit ? "Update the ticket details" : "Fill in the details for the new ticket";
    const buttonText = isEdit ? "Update Ticket" : "Add Ticket";
    const handleSubmit = isEdit ? handleEditTicket : handleAddTicket;
    
    // Ensure formData is properly initialized with current values
    const formData = isEdit ? editingTicket || initialTicketState : newTicket;
    const setFormData = isEdit ? setEditingTicket : setNewTicket;

    // Safe package filtering based on selected event
    const filteredPackages = packages
      .filter(pkg => !formData?.event_id || pkg?.event_id === formData.event_id);

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          if (!isEdit) {
            setNewTicket(initialTicketState);
          }
          setEditingTicket(null);
        }
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Event and Package Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event">Event</Label>
                <Select
                  value={formData?.event_id || ""}
                  onValueChange={(value) => {
                    const selectedEvent = events.find(e => e?.event_id === value);
                    setFormData({ 
                      ...formData, 
                      event_id: value,
                      event: selectedEvent?.event || "",
                      package_id: "",
                      package_type: ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem 
                        key={event?.event_id || crypto.randomUUID()}
                        value={event?.event_id || ""}
                      >
                        {event?.event || "Unnamed Event"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="package">Package</Label>
                <Select
                  value={formData?.package_id || ""}
                  onValueChange={(value) => {
                    const selectedPackage = packages.find(p => p?.package_id === value);
                    setFormData({ 
                      ...formData, 
                      package_id: value,
                      package_type: selectedPackage?.package_type || ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPackages.map((pkg) => (
                      <SelectItem 
                        key={pkg?.package_id || crypto.randomUUID()}
                        value={pkg?.package_id || ""}
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
              <h4 className="font-medium">Ticket Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket_name">Ticket Name</Label>
                  <Input
                    id="ticket_name"
                    value={formData?.ticket_name || ""}
                    onChange={(e) => setFormData({ ...formData, ticket_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData?.supplier || ""}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ref">Reference</Label>
                  <Input
                    id="ref"
                    value={formData?.ref || ""}
                    onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="markup">Markup</Label>
                  <Input
                    id="markup"
                    value={formData?.markup || "0%"}
                    onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Stock and Cost Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Stock & Cost Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actual_stock">Stock</Label>
                  <Input
                    id="actual_stock"
                    type="number"
                    value={formData?.actual_stock || 0}
                    onChange={(e) => setFormData({ ...formData, actual_stock: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="used">Used Tickets</Label>
                  <Input
                    id="used"
                    type="number"
                    value={formData?.used || 0}
                    onChange={(e) => setFormData({ ...formData, used: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData?.["currency_(bought_in)"] || ""}
                    onChange={(e) => setFormData({ ...formData, "currency_(bought_in)": e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost_local">Unit Cost (Local)</Label>
                  <Input
                    id="unit_cost_local"
                    type="number"
                    value={formData?.["unit_cost_(local)"] || 0}
                    onChange={(e) => setFormData({ ...formData, "unit_cost_(local)": parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost_gbp">Unit Cost (GBP)</Label>
                  <Input
                    id="unit_cost_gbp"
                    type="number"
                    value={formData?.["unit_cost_(gbp)"] || 0}
                    onChange={(e) => setFormData({ ...formData, "unit_cost_(gbp)": parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ordered"
                    checked={formData?.ordered || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, ordered: checked })}
                  />
                  <Label htmlFor="ordered">Ordered</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="paid"
                    checked={formData?.paid || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, paid: checked })}
                  />
                  <Label htmlFor="paid">Paid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="received"
                    checked={formData?.tickets_received || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, tickets_received: checked })}
                  />
                  <Label htmlFor="received">Received</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="provisional"
                    checked={formData?.is_provsional || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_provsional: checked })}
                  />
                  <Label htmlFor="provisional">Provisional</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{buttonText}</Button>
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
              <TableHead>Ticket</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Cost (GBP)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              // Find corresponding event object
              const eventObj = events.find(e => e.event === item.event);
              
              return (
                <TableRow key={item.ticket_id}>
                  <TableCell className="font-medium">{item.event}</TableCell>
                  <TableCell>{item.ticket_name}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.ref}</TableCell>
                  <TableCell>{item.actual_stock}</TableCell>
                  <TableCell>{item.used}</TableCell>
                  <TableCell>
                    <Badge variant={item.remaining > 0 ? "default" : "destructive"}>
                      {item.remaining}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item["unit_cost_(gbp)"] ? `£${item["unit_cost_(gbp)"].toFixed(2)}` : 'N/A'}
                  </TableCell>
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
                        onClick={() => openEditDialog({
                          ...item,
                          event_id: eventObj?.event_id
                        })}
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
      />

      {/* Edit Dialog */}
      <TicketDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        ticket={editingTicket}
      />
    </div>
  );
}

export { TicketTable };
