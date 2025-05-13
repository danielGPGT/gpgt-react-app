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

function AirportTransferTable() {
  const [transfers, setTransfers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const itemsPerPage = 15;

  // Column mappings for API operations
  const columnMappings = {
    event_name: "Event Name",
    hotel_name: "Hotel Name",
    transport_type: "Transport Type",
    max_capacity: "Max Capacity",
    used: "Used",
    total_budget: "Total Budget",
    budget_per_car: "Budget Per Car",
    supplier: "Supplier",
    supplier_quote_per_car_local: "Supplier Quote (Local)",
    quote_currency: "Quote Currency",
    supplier_quote_per_car_gbp: "Supplier Quote (GBP)",
    diff: "Difference",
    total_diff: "Total Difference",
    total_owing_to_supplier: "Total Owing to Supplier",
    paid_to_supplier: "Paid to Supplier",
    outstanding: "Outstanding",
    markup: "Markup"
  };

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    event: "all",
    transport_type: "all",
    supplier: "all",
  });

  // Form state
  const initialTransferState = {
    event_name: "",
    hotel_name: "",
    transport_type: "",
    max_capacity: 4,
    used: 0,
    total_budget: 0,
    budget_per_car: 0,
    supplier: "",
    supplier_quote_per_car_local: 0,
    quote_currency: "GBP",
    supplier_quote_per_car_gbp: 0,
    diff: 0,
    total_diff: 0,
    total_owing_to_supplier: 0,
    paid_to_supplier: false,
    outstanding: false,
    markup: "55%"
  };
  const [newTransfer, setNewTransfer] = useState(initialTransferState);

  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [cellValue, setCellValue] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const sortColumns = [
    { value: "event_name", label: "Event" },
    { value: "hotel_name", label: "Hotel" },
    { value: "transport_type", label: "Transport Type" },
    { value: "supplier", label: "Supplier" },
    { value: "total_budget", label: "Total Budget" },
    { value: "budget_per_car", label: "Budget Per Car" },
  ];
  const [sortColumn, setSortColumn] = useState("event_name");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [transfersRes, eventsRes] = await Promise.all([
        api.get("Stock%20-%20airport%20transfers"),
        api.get("event"),
      ]);

      setTransfers(transfersRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      setTransfers([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique events from transfers data
  const getUniqueEvents = () => {
    const uniqueEvents = [...new Set(transfers.map((item) => item.event_name))];
    return uniqueEvents.filter((event) => event);
  };

  // Get unique transport types for filter
  const getUniqueTransportTypes = () => {
    const uniqueTypes = [...new Set(transfers.map((item) => item.transport_type))];
    return uniqueTypes.filter((type) => type);
  };

  // Get unique suppliers for filter
  const getUniqueSuppliers = () => {
    const uniqueSuppliers = [...new Set(transfers.map((item) => item.supplier))];
    return uniqueSuppliers.filter((supplier) => supplier);
  };

  // Filter functions
  const filterTransfers = (items) => {
    return items.filter((item) => {
      // Search filter
      const searchMatch =
        filters.search === "" ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      // Event filter
      const eventMatch = filters.event === "all" || item.event_name === filters.event;

      // Transport type filter
      const typeMatch = filters.transport_type === "all" || item.transport_type === filters.transport_type;

      // Supplier filter
      const supplierMatch = filters.supplier === "all" || item.supplier === filters.supplier;

      return searchMatch && eventMatch && typeMatch && supplierMatch;
    });
  };

  // Filtered and sorted transfers
  const filteredTransfers = useMemo(() => {
    let result = filterTransfers(transfers);
    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        // For numbers, sort numerically
        if (["max_capacity", "used", "total_budget", "budget_per_car", "supplier_quote_per_car_local", "supplier_quote_per_car_gbp", "diff", "total_diff", "total_owing_to_supplier"].includes(sortColumn)) {
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
  }, [transfers, filters, sortColumn, sortDirection]);

  // Handle cell save
  const handleCellSave = async (rowId, field) => {
    try {
      if (columnMappings[field]) {
        const updateData = {
          column: columnMappings[field],
          value: cellValue
        };

        const encodedSheetName = encodeURIComponent("Stock - Airport Transfers");
        await api.put(
          `${encodedSheetName}/airport_transfer_id/${rowId}`,
          updateData
        );

        toast.success("Field updated successfully");
        fetchInitialData();
      }
    } catch (error) {
      console.error("Failed to update field:", error);
      toast.error(error.response?.data?.error || "Failed to update field");
    } finally {
      setEditingCell({ rowId: null, field: null });
      setCellValue("");
    }
  };

  // Add transfer
  const handleAddTransfer = async (formData) => {
    try {
      setIsAdding(true);

      // Check if transfer already exists for this event and hotel
      const existingTransfer = transfers.find(
        transfer => 
          transfer.event_name === formData.event_name && 
          transfer.hotel_name === formData.hotel_name &&
          transfer.transport_type === formData.transport_type
      );

      if (existingTransfer) {
        toast.error("This transfer already exists for the selected event and hotel");
        return;
      }

      const transferData = {
        ...formData,
        airport_transfer_id: crypto.randomUUID(),
        used: 0,
        diff: 0,
        total_diff: 0,
        total_owing_to_supplier: 0,
        paid_to_supplier: false,
        outstanding: false
      };

      const encodedSheetName = encodeURIComponent("Stock - Airport Transfers");
      await api.post(encodedSheetName, transferData);

      setSuccessMessage("Airport transfer added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to add airport transfer:", error);
      toast.error(error.response?.data?.error || "Failed to add airport transfer");
    } finally {
      setIsAdding(false);
    }
  };

  // Edit transfer
  const handleEditTransfer = async (changedFields) => {
    try {
      setIsEditing(true);

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        setEditingTransfer(null);
        return;
      }

      // If event, hotel, or transport type is being changed, check for duplicates
      if (changedFields.event_name || changedFields.hotel_name || changedFields.transport_type) {
        const newEvent = changedFields.event_name || editingTransfer.event_name;
        const newHotel = changedFields.hotel_name || editingTransfer.hotel_name;
        const newType = changedFields.transport_type || editingTransfer.transport_type;

        const existingTransfer = transfers.find(
          transfer => 
            transfer.event_name === newEvent && 
            transfer.hotel_name === newHotel &&
            transfer.transport_type === newType &&
            transfer.airport_transfer_id !== editingTransfer.airport_transfer_id
        );

        if (existingTransfer) {
          toast.error("This transfer already exists for the selected event and hotel");
          return;
        }
      }

      const transferId = editingTransfer.airport_transfer_id;
      const encodedSheetName = encodeURIComponent("Stock - Airport Transfers");

      for (const [field, value] of Object.entries(changedFields)) {
        if (columnMappings[field]) {
          await api.put(`${encodedSheetName}/airport_transfer_id/${transferId}`, {
            column: columnMappings[field],
            value: value,
          });
        }
      }

      setSuccessMessage("Airport transfer updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      setEditingTransfer(null);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update airport transfer:", error);
      toast.error("Failed to update airport transfer");
    } finally {
      setIsEditing(false);
    }
  };

  // Delete transfer
  const handleDeleteTransfer = async (transferId) => {
    setTransferToDelete(transferId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const encodedSheetName = encodeURIComponent("Stock - Airport Transfers");
      await api.delete(
        `${encodedSheetName}/airport_transfer_id/${transferToDelete}`
      );
      setSuccessMessage("Airport transfer deleted successfully!");
      setShowSuccessDialog(true);
      setShowDeleteConfirm(false);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to delete airport transfer:", error);
      toast.error(error.response?.data?.error || "Failed to delete airport transfer");
    } finally {
      setIsDeleting(false);
      setTransferToDelete(null);
    }
  };

  // Apply filters and calculate pagination
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTransfers.slice(startIndex, endIndex);

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

  // Handle cell edit
  const handleCellEdit = (rowId, field, value) => {
    setEditingCell({ rowId, field });
    setCellValue(value);
  };

  // Handle cell cancel
  const handleCellCancel = () => {
    setEditingCell({ rowId: null, field: null });
    setCellValue("");
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading airport transfers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search airport transfers..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>
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
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.transport_type}
          onValueChange={(value) => setFilters({ ...filters, transport_type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {getUniqueTransportTypes().map((type) => (
              <SelectItem key={type} value={type}>
                {type}
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
              <SelectItem key={supplier} value={supplier}>
                {supplier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <span className="text-sm text-muted-foreground">
              Sorted by <span className="font-medium">{sortColumns.find(c => c.value === sortColumn)?.label}</span> ({sortDirection === "asc" ? "A-Z" : "Z-A"})
            </span>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Airport Transfer
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Hotel</TableHead>
              <TableHead className="text-xs py-2">Transport Type</TableHead>
              <TableHead className="text-xs py-2">Max Cap</TableHead>
              <TableHead className="text-xs py-2">Used</TableHead>
              <TableHead className="text-xs py-2">Total Budget</TableHead>
              <TableHead className="text-xs py-2">Per Car</TableHead>
              <TableHead className="text-xs py-2">Supplier</TableHead>
              <TableHead className="text-xs py-2">Local Quote</TableHead>
              <TableHead className="text-xs py-2">Currency</TableHead>
              <TableHead className="text-xs py-2">GBP Quote</TableHead>
              <TableHead className="text-xs py-2">Diff</TableHead>
              <TableHead className="text-xs py-2">Total Diff</TableHead>
              <TableHead className="text-xs py-2">Owing</TableHead>
              <TableHead className="text-xs py-2">Paid</TableHead>
              <TableHead className="text-xs py-2">Out</TableHead>
              <TableHead className="text-xs py-2">Markup</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              const isEditing = editingCell.rowId === item.airport_transfer_id;
              return (
                <TableRow key={item.airport_transfer_id} className="hover:bg-muted/50">
                  <TableCell className="text-xs py-1.5 font-medium">{item.event_name}</TableCell>
                  <TableCell className="text-xs py-1.5">{item.hotel_name}</TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "transport_type" ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.airport_transfer_id, "transport_type")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(item.airport_transfer_id, "transport_type");
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.airport_transfer_id, "transport_type", item.transport_type)}
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        {item.transport_type}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "max_capacity" ? (
                      <Input
                        type="number"
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.airport_transfer_id, "max_capacity")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(item.airport_transfer_id, "max_capacity");
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.airport_transfer_id, "max_capacity", item.max_capacity)}
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        {item.max_capacity}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">{item.used}</TableCell>
                  <TableCell className="text-xs py-1.5">£{item.total_budget}</TableCell>
                  <TableCell className="text-xs py-1.5">£{item.budget_per_car}</TableCell>
                  <TableCell className="text-xs py-1.5">{item.supplier}</TableCell>
                  <TableCell className="text-xs py-1.5">{item.supplier_quote_per_car_local}</TableCell>
                  <TableCell className="text-xs py-1.5">{item.quote_currency}</TableCell>
                  <TableCell className="text-xs py-1.5">£{item.supplier_quote_per_car_gbp}</TableCell>
                  <TableCell className="text-xs py-1.5">£{item.diff}</TableCell>
                  <TableCell className="text-xs py-1.5">£{item.total_diff}</TableCell>
                  <TableCell className="text-xs py-1.5">£{item.total_owing_to_supplier}</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <Checkbox
                      checked={item.paid_to_supplier}
                      disabled
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <Checkbox
                      checked={item.outstanding}
                      disabled
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="text-xs py-1.5">{item.markup}</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTransfer(item);
                          setIsEditDialogOpen(true);
                        }}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransfer(item.airport_transfer_id)}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredTransfers.length)}{" "}
          of {filteredTransfers.length} items
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingTransfer(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Airport Transfer" : "Add New Airport Transfer"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the airport transfer details"
                : "Fill in the details for the new airport transfer"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">Event</Label>
                <Combobox
                  options={events.map((event) => ({
                    value: event.event,
                    label: event.event,
                  }))}
                  value={isEditDialogOpen ? editingTransfer?.event_name : newTransfer.event_name}
                  onChange={(value) => {
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({ ...prev, event_name: value }));
                    } else {
                      setNewTransfer((prev) => ({ ...prev, event_name: value }));
                    }
                  }}
                  placeholder="Select event"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hotel_name">Hotel</Label>
                <Input
                  id="hotel_name"
                  value={isEditDialogOpen ? editingTransfer?.hotel_name : newTransfer.hotel_name}
                  onChange={(e) => {
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({ ...prev, hotel_name: e.target.value }));
                    } else {
                      setNewTransfer((prev) => ({ ...prev, hotel_name: e.target.value }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transport_type">Transport Type</Label>
                <Select
                  value={isEditDialogOpen ? editingTransfer?.transport_type : newTransfer.transport_type}
                  onValueChange={(value) => {
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({ ...prev, transport_type: value }));
                    } else {
                      setNewTransfer((prev) => ({ ...prev, transport_type: value }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hotel Chauffeur">Hotel Chauffeur</SelectItem>
                    <SelectItem value="Private Transfer">Private Transfer</SelectItem>
                    <SelectItem value="Shared Transfer">Shared Transfer</SelectItem>
                    <SelectItem value="VIP Transfer">VIP Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Max Capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  value={isEditDialogOpen ? editingTransfer?.max_capacity : newTransfer.max_capacity}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({
                        ...prev,
                        max_capacity: value
                      }));
                    } else {
                      setNewTransfer((prev) => ({
                        ...prev,
                        max_capacity: value
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_budget">Total Budget (£)</Label>
                <Input
                  id="total_budget"
                  type="number"
                  value={isEditDialogOpen ? editingTransfer?.total_budget : newTransfer.total_budget}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({
                        ...prev,
                        total_budget: value
                      }));
                    } else {
                      setNewTransfer((prev) => ({
                        ...prev,
                        total_budget: value
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_per_car">Budget Per Car (£)</Label>
                <Input
                  id="budget_per_car"
                  type="number"
                  value={isEditDialogOpen ? editingTransfer?.budget_per_car : newTransfer.budget_per_car}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({
                        ...prev,
                        budget_per_car: value
                      }));
                    } else {
                      setNewTransfer((prev) => ({
                        ...prev,
                        budget_per_car: value
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={isEditDialogOpen ? editingTransfer?.supplier : newTransfer.supplier}
                  onChange={(e) => {
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({ ...prev, supplier: e.target.value }));
                    } else {
                      setNewTransfer((prev) => ({ ...prev, supplier: e.target.value }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_quote_per_car_local">Supplier Quote (Local)</Label>
                <Input
                  id="supplier_quote_per_car_local"
                  type="number"
                  value={isEditDialogOpen ? editingTransfer?.supplier_quote_per_car_local : newTransfer.supplier_quote_per_car_local}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({
                        ...prev,
                        supplier_quote_per_car_local: value
                      }));
                    } else {
                      setNewTransfer((prev) => ({
                        ...prev,
                        supplier_quote_per_car_local: value
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote_currency">Quote Currency</Label>
                <Input
                  id="quote_currency"
                  value={isEditDialogOpen ? editingTransfer?.quote_currency : newTransfer.quote_currency}
                  onChange={(e) => {
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({ ...prev, quote_currency: e.target.value }));
                    } else {
                      setNewTransfer((prev) => ({ ...prev, quote_currency: e.target.value }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_quote_per_car_gbp">Supplier Quote (GBP)</Label>
                <Input
                  id="supplier_quote_per_car_gbp"
                  type="number"
                  value={isEditDialogOpen ? editingTransfer?.supplier_quote_per_car_gbp : newTransfer.supplier_quote_per_car_gbp}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({
                        ...prev,
                        supplier_quote_per_car_gbp: value
                      }));
                    } else {
                      setNewTransfer((prev) => ({
                        ...prev,
                        supplier_quote_per_car_gbp: value
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup">Markup (%)</Label>
                <Input
                  id="markup"
                  type="number"
                  value={isEditDialogOpen ? editingTransfer?.markup?.replace('%', '') : newTransfer.markup?.replace('%', '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isEditDialogOpen) {
                      setEditingTransfer((prev) => ({
                        ...prev,
                        markup: `${value}%`
                      }));
                    } else {
                      setNewTransfer((prev) => ({
                        ...prev,
                        markup: `${value}%`
                      }));
                    }
                  }}
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
                setEditingTransfer(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isEditDialogOpen) {
                  handleEditTransfer(editingTransfer);
                } else {
                  handleAddTransfer(newTransfer);
                }
              }}
              disabled={isAdding || isEditing}
            >
              {isAdding || isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditDialogOpen ? "Updating..." : "Adding..."}
                </>
              ) : isEditDialogOpen ? (
                "Update Airport Transfer"
              ) : (
                "Add Airport Transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setShowDeleteConfirm(false);
            setTransferToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              airport transfer.
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
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
      >
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
    </div>
  );
}

export { AirportTransferTable };
