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
  AlertCircle,
  Clock,
  CreditCard,
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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

function AirportTransferTable() {
  const [transfers, setTransfers] = useState([]);
  const [events, setEvents] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransfers, setSelectedTransfers] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Generate a unique ID for new transfers
  const generateAirportTransferId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Form state
  const initialTransferState = {
    event_id: "",
    event_name: "",
    package_id: "",
    package_type: "Both",
    hotel_id: "",
    airport_transfer_id: "",
    hotel_name: "",
    transport_type: "",
    max_capacity: "",
    supplier: "",
    quote_currency: "",
    supplier_quote_per_car_local: "",
    paid_to_supplier: false,
    outstanding: false,
    markup: "55"
  };

  const [editingTransfer, setEditingTransfer] = useState(initialTransferState);
  const [newTransfer, setNewTransfer] = useState(initialTransferState);
  const itemsPerPage = 15;

  // Column mappings for API operations
  const columnMappings = {
    event_id: "Event ID",
    package_type: "Package Type",
    hotel_id: "Hotel ID",
    transport_type: "Transport Type",
    max_capacity: "Max Capacity",
    supplier: "Supplier",
    quote_currency: "Quote Currency",
    supplier_quote_per_car_local: "Supplier quote per car local",
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
    package_type: "all",
  });

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
    fetchHotelsForEvent();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [transfersRes, eventsRes] = await Promise.all([
        api.get("stock-airport-transfers"),
        api.get("events"),
      ]);

      setTransfers(transfersRes.data.map(transformDataFromAPI));
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

  const fetchHotelsForEvent = async () => {
    try {
      const response = await api.get("hotels");
      setHotels(response.data);
    } catch (error) {
      console.error("Failed to fetch hotels:", error);
      toast.error("Failed to load hotels");
      setHotels([]);
    }
  };

  // Get unique events from transfers data
  const getUniqueEvents = () => {
    const uniqueEvents = [...new Set(transfers.map((item) => item.event_name))];
    return uniqueEvents.filter((event) => event);
  };

  // Get unique transport types for filter
  const getUniqueTransportTypes = () => {
    const uniqueTypes = [
      ...new Set(transfers.map((item) => item.transport_type)),
    ];
    return uniqueTypes.filter((type) => type);
  };

  // Get unique suppliers for filter
  const getUniqueSuppliers = () => {
    const uniqueSuppliers = [
      ...new Set(transfers.map((item) => item.supplier)),
    ];
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
      const eventMatch =
        filters.event === "all" || item.event_name === filters.event;

      // Package type filter
      const packageTypeMatch =
        filters.package_type === "all" ||
        item.package_type === filters.package_type;

      // Transport type filter
      const typeMatch =
        filters.transport_type === "all" ||
        item.transport_type === filters.transport_type;

      // Supplier filter
      const supplierMatch =
        filters.supplier === "all" || item.supplier === filters.supplier;

      return (
        searchMatch &&
        eventMatch &&
        packageTypeMatch &&
        typeMatch &&
        supplierMatch
      );
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
        if (
          [
            "max_capacity",
            "used",
            "total_budget",
            "budget_per_car",
            "supplier_quote_per_car_local",
            "supplier_quote_per_car_gbp",
            "diff",
            "total_diff",
            "total_owing_to_supplier",
          ].includes(sortColumn)
        ) {
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

  // Edit transfer
  const handleEditTransfer = async (changedFields) => {
    try {
      setIsEditing(true);
      const loadingToast = toast.loading("Updating transfer...");

      if (!editingTransfer?.airport_transfer_id) {
        toast.dismiss(loadingToast);
        toast.error("Invalid transfer ID");
        return false;
      }

      if (Object.keys(changedFields).length === 0) {
        toast.dismiss(loadingToast);
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        setEditingTransfer(null);
        return;
      }

      const transferId = editingTransfer.airport_transfer_id;

      // Prepare updates array for bulk update
      const updates = Object.entries(changedFields).map(([field, value]) => {
        // Format the value based on field type
        let processedValue = value;
        if (field === 'paid_to_supplier' || field === 'outstanding') {
          processedValue = value ? "TRUE" : "FALSE";
        } else if (field === 'markup') {
          processedValue = value.toString();
        } else if (field === 'max_capacity') {
          processedValue = parseInt(value) || 0;
        } else if (field === 'supplier_quote_per_car_local') {
          processedValue = parseFloat(value) || 0;
        }

        return {
          column: field,
          value: processedValue
        };
      });

      // Send bulk update request
      await api.put(`/stock-airport-transfers/airport_transfer_id/${transferId}/bulk`, updates);

      await fetchInitialData();
      toast.dismiss(loadingToast);
      toast.success("Transfer updated successfully!");
      setIsEditDialogOpen(false);
      setEditingTransfer(null);
      return true;
    } catch (error) {
      console.error("Failed to update transfer:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.dismiss();
      toast.error(error.response?.data?.error || "Failed to update transfer. Please try again.");
      return false;
    } finally {
      setIsEditing(false);
    }
  };

  // When opening edit dialog
  const handleEditClick = (transfer) => {
    // Format boolean values and markup for the form
    const formattedTransfer = {
      ...transfer,
      paid_to_supplier: transfer.paid_to_supplier === true || transfer.paid_to_supplier === "TRUE" || transfer.paid_to_supplier === "true",
      outstanding: transfer.outstanding === true || transfer.outstanding === "TRUE" || transfer.outstanding === "true",
      markup: transfer.markup?.toString().replace('%', '') || '55'
    };
    setEditingTransfer(formattedTransfer);
    setIsEditDialogOpen(true);
  };

  // Add transfer
  const handleAddTransfer = async (formData) => {
    try {
      setIsAdding(true);
      const loadingToast = toast.loading("Adding new transfer...");

      // Validate required fields
      const requiredFields = ['event_id', 'package_type', 'hotel_id', 'transport_type'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.dismiss(loadingToast);
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      const apiData = transformDataForAPI({
        ...formData,
        airport_transfer_id: generateAirportTransferId()
      });

      await api.post("stock-airport-transfers", apiData);
      toast.dismiss(loadingToast);
      setSuccessMessage("Airport transfer added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
      await fetchInitialData();
    } catch (error) {
      console.error("Failed to add airport transfer:", error);
      toast.error(error.response?.data?.error || "Failed to add airport transfer");
    } finally {
      setIsAdding(false);
    }
  };

  // Delete transfer
  const handleDeleteTransfer = async (transferId) => {
    if (!transferId) {
      toast.error("Invalid transfer ID");
      return;
    }
    setTransferToDelete(transferId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!transferToDelete) {
      toast.error("Invalid transfer ID");
      return;
    }

    try {
      setIsDeleting(true);
      const loadingToast = toast.loading("Deleting transfer...");
      
      await api.delete(`stock-airport-transfers/airport_transfer_id/${transferToDelete}`);
      
      toast.dismiss(loadingToast);
      setSuccessMessage("Airport transfer deleted successfully!");
      setShowSuccessDialog(true);
      setShowDeleteConfirm(false);
      await fetchInitialData();
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

  // Helper function to transform data for API
  const transformDataForAPI = (data) => {
    return {
      "airport_transfer_id": data.airport_transfer_id || crypto.randomUUID(),
      "event_id": data.event_id || "",
      "package_type": data.package_type || "",
      "hotel_id": data.hotel_id || "",
      "transport_type": data.transport_type || "",
      "max_capacity": parseInt(data.max_capacity) || 0,
      "supplier": data.supplier || "",
      "quote_currency": data.quote_currency || "",
      "supplier_quote_per_car_local": parseFloat(data.supplier_quote_per_car_local) || 0,
      "paid_to_supplier": data.paid_to_supplier === true ? "TRUE" : "FALSE",
      "outstanding": data.outstanding === true ? "TRUE" : "FALSE",
      "markup": data.markup ? `${data.markup}%` : "55%"
    };
  };

  // Helper function to transform data from API
  const transformDataFromAPI = (data) => {
    return {
      ...data,
      max_capacity: parseInt(data.max_capacity) || 0,
      supplier_quote_per_car_local: parseFloat(data.supplier_quote_per_car_local) || 0,
      paid_to_supplier: data.paid_to_supplier === true || data.paid_to_supplier === "TRUE" || data.paid_to_supplier === "true",
      outstanding: data.outstanding === true || data.outstanding === "TRUE" || data.outstanding === "true",
      markup: data.markup?.toString().replace('%', '') || '55'
    };
  };

  // Update the form inputs to handle undefined values
  const getFormValue = (field) => {
    if (isEditDialogOpen) {
      return editingTransfer?.[field] ?? "";
    }
    return newTransfer[field] ?? "";
  };

  const handleFormChange = (field, value) => {
    if (isEditDialogOpen) {
      setEditingTransfer(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setNewTransfer(prev => ({
        ...prev,
        [field]: value
      }));
    }
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
          value={filters.package_type}
          onValueChange={(value) =>
            setFilters({ ...filters, package_type: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            <SelectItem value="Both">Both</SelectItem>
            <SelectItem value="Grandstand">Grandstand</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.transport_type}
          onValueChange={(value) =>
            setFilters({ ...filters, transport_type: value })
          }
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
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
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
                    sortDirection === "asc" ? "font-semibold text-primary" : ""
                  }
                >
                  Ascending {sortDirection === "asc" && "▲"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortDirection("desc")}
                  className={
                    sortDirection === "desc" ? "font-semibold text-primary" : ""
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
          <div className="flex items-center gap-2">
            {selectedTransfers.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={isBulkDeleting}
              >
                Delete Selected ({selectedTransfers.length})
              </Button>
            )}
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Airport Transfer
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="text-xs py-2 w-8">
                <Checkbox
                  checked={selectedTransfers.length === currentItems.length && currentItems.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTransfers(currentItems.map((item) => item.airport_transfer_id));
                    } else {
                      setSelectedTransfers([]);
                    }
                  }}
                  aria-label="Select all"
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Package Type</TableHead>
              <TableHead className="text-xs py-2">Hotel</TableHead>
              <TableHead className="text-xs py-2">Transport Type</TableHead>
              <TableHead className="text-xs py-2">Max Capacity</TableHead>
              <TableHead className="text-xs py-2">Budget per car</TableHead>
              <TableHead className="text-xs py-2">Supplier</TableHead>
              <TableHead className="text-xs py-2">Quote Currency</TableHead>
              <TableHead className="text-xs py-2">Local Quote per car</TableHead>
              <TableHead className="text-xs py-2">Status</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              const isEditing = editingCell.rowId === item.airport_transfer_id;
              const isPaid = !!item.paid_to_supplier;
              const isOutstanding = !!item.outstanding;
              return (
                <TableRow
                  key={item.airport_transfer_id}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="text-xs py-1.5 w-8">
                    <Checkbox
                      checked={selectedTransfers.includes(item.airport_transfer_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTransfers((prev) => [...prev, item.airport_transfer_id]);
                        } else {
                          setSelectedTransfers((prev) => prev.filter((id) => id !== item.airport_transfer_id));
                        }
                      }}
                      aria-label="Select row"
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="text-xs py-1.5 font-medium">
                    {item.event_name}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {item.package_type}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {item.hotel_name}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "transport_type" ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() =>
                          handleCellSave(
                            item.airport_transfer_id,
                            "transport_type"
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleCellSave(
                              item.airport_transfer_id,
                              "transport_type"
                            );
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() =>
                          handleCellEdit(
                            item.airport_transfer_id,
                            "transport_type",
                            item.transport_type
                          )
                        }
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
                        onBlur={() =>
                          handleCellSave(
                            item.airport_transfer_id,
                            "max_capacity"
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleCellSave(
                              item.airport_transfer_id,
                              "max_capacity"
                            );
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() =>
                          handleCellEdit(
                            item.airport_transfer_id,
                            "max_capacity",
                            item.max_capacity
                          )
                        }
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        {item.max_capacity}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    £{item.budget_per_car}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {item.supplier}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {item.quote_currency}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "supplier_quote_per_car_local" ? (
                      <Input
                        id="supplier_quote_per_car_local"
                        type="number"
                        value={getFormValue("supplier_quote_per_car_local")}
                        onChange={(e) => handleFormChange("supplier_quote_per_car_local", e.target.value)}
                      />
                    ) : (
                      <div
                        onClick={() =>
                          handleCellEdit(
                            item.airport_transfer_id,
                            "supplier_quote_per_car_local",
                            item.supplier_quote_per_car_local
                          )
                        }
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        {item.supplier_quote_per_car_local}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={isPaid ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isPaid ? "Paid to Supplier" : "Not Paid"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={isOutstanding ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}
                            >
                              {isOutstanding ? (
                                <AlertCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isOutstanding ? "Outstanding" : "All Clear"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(item)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteTransfer(item.airport_transfer_id)
                        }
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
          Showing {startIndex + 1} to{" "}
          {Math.min(endIndex, filteredTransfers.length)} of{" "}
          {filteredTransfers.length} items
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
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen
                ? "Edit Airport Transfer"
                : "Add New Airport Transfer"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the airport transfer details"
                : "Fill in the details for the new airport transfer"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Basic Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_name">Event</Label>
                    <Combobox
                      options={events.map((event) => ({
                        value: event.event,
                        label: event.event,
                        id: event.event_id
                      }))}
                      value={getFormValue("event_name")}
                      onChange={(value) => {
                        const selectedEvent = events.find(e => e.event === value);
                        if (isEditDialogOpen) {
                          setEditingTransfer((prev) => ({
                            ...prev,
                            event_name: value,
                            event_id: selectedEvent?.event_id || "",
                            hotel_name: "", // Reset hotel when event changes
                          }));
                        } else {
                          setNewTransfer((prev) => ({
                            ...prev,
                            event_name: value,
                            event_id: selectedEvent?.event_id || "",
                            hotel_name: "", // Reset hotel when event changes
                          }));
                        }
                      }}
                      placeholder="Select event"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="package_type">Package Type</Label>
                    <Select
                      value={getFormValue("package_type")}
                      onValueChange={(value) => handleFormChange("package_type", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select package type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Both">Both</SelectItem>
                        <SelectItem value="Grandstand">Grandstand</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotel_name">Hotel</Label>
                    <Combobox
                      options={hotels.map((hotel) => ({
                        value: hotel.hotel_name,
                        label: hotel.hotel_name,
                        id: hotel.hotel_id
                      }))}
                      value={getFormValue("hotel_name")}
                      onChange={(value) => {
                        const selectedHotel = hotels.find(h => h.hotel_name === value);
                        if (isEditDialogOpen) {
                          setEditingTransfer((prev) => ({
                            ...prev,
                            hotel_name: value,
                            hotel_id: selectedHotel?.hotel_id || "",
                          }));
                        } else {
                          setNewTransfer((prev) => ({
                            ...prev,
                            hotel_name: value,
                            hotel_id: selectedHotel?.hotel_id || "",
                          }));
                        }
                      }}
                      placeholder="Select hotel"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transport_type">Transport Type</Label>
                    <Select
                      value={getFormValue("transport_type")}
                      onValueChange={(value) => handleFormChange("transport_type", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          isEditDialogOpen 
                            ? `Current: ${editingTransfer?.transport_type || "Select type"}`
                            : "Select type"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hotel Chauffeur">
                          Hotel Chauffeur
                        </SelectItem>
                        <SelectItem value="Private Transfer">
                          Private Transfer
                        </SelectItem>
                        <SelectItem value="Shared Transfer">
                          Shared Transfer
                        </SelectItem>
                        <SelectItem value="VIP Transfer">VIP Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_capacity">Max Capacity</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      value={getFormValue("max_capacity")}
                      onChange={(e) => handleFormChange("max_capacity", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Financial Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Financial Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={getFormValue("supplier")}
                      onChange={(e) => handleFormChange("supplier", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quote_currency">Quote Currency</Label>
                    <Select
                      value={getFormValue("quote_currency")}
                      onValueChange={(value) => handleFormChange("quote_currency", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="NZD">NZD</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="BHD">BHD</SelectItem>
                        <SelectItem value="SGD">SGD</SelectItem>
                        <SelectItem value="QAR">QAR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="MYR">MYR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_quote_per_car_local">
                      Local Quote per car
                    </Label>
                    <Input
                      id="supplier_quote_per_car_local"
                      type="number"
                      value={getFormValue("supplier_quote_per_car_local")}
                      onChange={(e) => handleFormChange("supplier_quote_per_car_local", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="markup">Markup (%)</Label>
                    <Input
                      id="markup"
                      type="number"
                      value={getFormValue("markup")}
                      onChange={(e) => handleFormChange("markup", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="paid_to_supplier">Paid to Supplier</Label>
                    <Switch
                      id="paid_to_supplier"
                      checked={!!getFormValue("paid_to_supplier")}
                      onCheckedChange={(checked) => handleFormChange("paid_to_supplier", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="outstanding">Outstanding</Label>
                    <Switch
                      id="outstanding"
                      checked={!!getFormValue("outstanding")}
                      onCheckedChange={(checked) => handleFormChange("outstanding", checked)}
                    />
                  </div>
                </div>
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
                  // Compare with original transfer to find changed fields
                  const changedFields = {};
                  Object.keys(editingTransfer).forEach(key => {
                    if (editingTransfer[key] !== transfers.find(t => t.airport_transfer_id === editingTransfer.airport_transfer_id)?.[key]) {
                      changedFields[key] = editingTransfer[key];
                    }
                  });
                  handleEditTransfer(changedFields);
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
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
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
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTransfers.length} selected transfer{selectedTransfers.length > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected airport transfer{selectedTransfers.length > 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isBulkDeleting}
              onClick={async () => {
                setIsBulkDeleting(true);
                try {
                  await Promise.all(selectedTransfers.map((id) =>
                    api.delete(`stock-airport-transfers/airport_transfer_id/${id}`)
                  ));
                  setSelectedTransfers([]);
                  setShowBulkDeleteDialog(false);
                  await fetchInitialData();
                  toast.success("Selected transfers deleted successfully!");
                } catch (error) {
                  toast.error("Failed to delete selected transfers");
                } finally {
                  setIsBulkDeleting(false);
                }
              }}
            >
              {isBulkDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                `Delete ${selectedTransfers.length}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { AirportTransferTable };
