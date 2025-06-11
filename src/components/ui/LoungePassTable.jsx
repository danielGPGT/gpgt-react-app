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

function LoungePassTable() {
  const [loungePasses, setLoungePasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPass, setEditingPass] = useState(null);
  const itemsPerPage = 10;

  // Column mappings for API operations
  const columnMappings = {
    event: "Event",
    event_id: "Event ID",
    lounge_pass_id: "Lounge Pass ID",
    variant: "Variant",
    used: "Used",
    cost: "Cost",
    margin: "Margin"
  };

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    event: "all",
    variant: "all",
  });

  // Form state
  const initialPassState = {
    event: "",
    event_id: "",
    variant: "",
    used: "",
    cost: "",
    margin: "55%"
  };
  const [newPass, setNewPass] = useState(initialPassState);

  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [cellValue, setCellValue] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passToDelete, setPassToDelete] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPasses, setSelectedPasses] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const sortColumns = [
    { value: "event", label: "Event" },
    { value: "variant", label: "Variant" },
    { value: "used", label: "Used" },
    { value: "cost", label: "Cost" },
    { value: "margin", label: "Margin" },
  ];
  const [sortColumn, setSortColumn] = useState("event");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [passesRes, eventsRes] = await Promise.all([
        api.get("stock-lounge-passes"),
        api.get("events"),
      ]);

      setLoungePasses(passesRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      setLoungePasses([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique events from lounge passes data
  const getUniqueEvents = () => {
    const uniqueEvents = [...new Set(loungePasses.map((item) => item.event))];
    return uniqueEvents.filter((event) => event);
  };

  // Get unique variants for filter
  const getUniqueVariants = () => {
    const uniqueVariants = [...new Set(loungePasses.map((item) => item.variant))];
    return uniqueVariants.filter((variant) => variant);
  };

  // Filter functions
  const filterPasses = (items) => {
    return items.filter((item) => {
      // Search filter
      const searchMatch =
        filters.search === "" ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      // Event filter
      const eventMatch = filters.event === "all" || item.event === filters.event;

      // Variant filter
      const variantMatch =
        filters.variant === "all" || item.variant === filters.variant;

      return searchMatch && eventMatch && variantMatch;
    });
  };

  // Filtered and sorted passes
  const filteredPasses = useMemo(() => {
    let result = filterPasses(loungePasses);
    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        // For numbers, sort numerically
        if (["used", "cost"].includes(sortColumn)) {
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
  }, [loungePasses, filters, sortColumn, sortDirection]);

  // Handle cell save
  const handleCellSave = async (rowId, field) => {
    try {
      if (columnMappings[field] && field !== 'event_id' && field !== 'used') {
        const updateData = {
          column: columnMappings[field],
          value: cellValue
        };

        const encodedSheetName = encodeURIComponent("stock-lounge-passes");
        console.log("Update request:", {
          sheetName: encodedSheetName,
          idColumn: "Lounge Pass ID",
          idValue: rowId,
          column: columnMappings[field],
          value: cellValue
        });

        await api.put(
          `${encodedSheetName}/lounge_pass_id/${rowId}`,
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

  // Helper function to transform data for API
  const transformDataForAPI = (data) => {
    return {
      "event_id": data.event_id || "",
      "variant": data.variant || "",
      "cost": parseFloat(data.cost) || 0,
      "margin": data.margin?.toString().replace('%', '') + '%' || "55%"
    };
  };

  // Helper function to transform data from API
  const transformDataFromAPI = (data) => {
    return {
      ...data,
      used: parseInt(data.used) || 0,
      cost: parseFloat(data.cost) || 0,
      margin: data.margin?.toString().replace('%', '') || '55'
    };
  };

  // Add pass
  const handleAddPass = async (formData) => {
    try {
      setIsAdding(true);
      const loadingToast = toast.loading("Adding new lounge pass...");

      // Check if variant already exists for this event
      const existingPass = loungePasses.find(
        pass => pass.event === formData.event && pass.variant === formData.variant
      );

      if (existingPass) {
        toast.dismiss(loadingToast);
        toast.error("This variant already exists for the selected event");
        return;
      }

      // Get event_id from the selected event
      const selectedEvent = events.find(e => e.event === formData.event);
      if (!selectedEvent) {
        toast.dismiss(loadingToast);
        toast.error("Invalid event selection");
        return;
      }

      // Create the pass data with the correct field mappings
      const passData = transformDataForAPI({
        ...formData,
        event_id: selectedEvent.event_id,
      });

      console.log("Adding lounge pass with data:", passData);

      // Properly encode the sheet name
      const encodedSheetName = encodeURIComponent("stock-lounge-passes");
      await api.post(encodedSheetName, passData);

      toast.dismiss(loadingToast);
      setSuccessMessage("Lounge pass added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
      await fetchInitialData();
    } catch (error) {
      console.error("Failed to add lounge pass:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to add lounge pass. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Edit pass
  const handleEditPass = async (changedFields) => {
    try {
      setIsEditing(true);
      const loadingToast = toast.loading("Updating lounge pass...");

      if (!editingPass?.lounge_pass_id) {
        toast.dismiss(loadingToast);
        toast.error("Invalid lounge pass ID");
        return;
      }

      if (Object.keys(changedFields).length === 0) {
        toast.dismiss(loadingToast);
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        setEditingPass(null);
        return;
      }

      // If event is being changed, get the new event_id
      if (changedFields.event) {
        const selectedEvent = events.find(e => e.event === changedFields.event);
        if (!selectedEvent) {
          toast.dismiss(loadingToast);
          toast.error("Invalid event selection");
          return;
        }
        changedFields.event_id = selectedEvent.event_id;
      }

      // If event or variant is being changed, check for duplicates
      if (changedFields.event || changedFields.variant) {
        const newEvent = changedFields.event || editingPass.event;
        const newVariant = changedFields.variant || editingPass.variant;

        const existingPass = loungePasses.find(
          pass => 
            pass.event === newEvent && 
            pass.variant === newVariant && 
            pass.lounge_pass_id !== editingPass.lounge_pass_id
        );

        if (existingPass) {
          toast.dismiss(loadingToast);
          toast.error("This variant already exists for the selected event");
          return;
        }
      }

      const passId = editingPass.lounge_pass_id;
      const encodedSheetName = encodeURIComponent("stock-lounge-passes");

      // Process all changed fields at once
      const processedData = {};
      for (const [field, value] of Object.entries(changedFields)) {
        if (field !== 'lounge_pass_id' && field !== 'event' && field !== 'used') {
          const processedValue = field === 'cost' ? parseFloat(value) || 0 :
                               field === 'margin' ? value.toString().replace('%', '') + '%' :
                               value;
          
          // Make individual API calls for each field as required by the API
          await api.put(`${encodedSheetName}/lounge_pass_id/${passId}`, {
            column: field,
            value: processedValue
          });
        }
      }

      toast.dismiss(loadingToast);
      setSuccessMessage("Lounge pass updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      setEditingPass(null);
      await fetchInitialData();
    } catch (error) {
      console.error("Failed to update lounge pass:", error);
      toast.error(error.response?.data?.error || "Failed to update lounge pass. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  // Delete pass
  const handleDeletePass = async (passId) => {
    if (!passId) {
      toast.error("Invalid lounge pass ID");
      return;
    }
    setPassToDelete(passId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!passToDelete) {
      toast.error("Invalid lounge pass ID");
      return;
    }

    try {
      setIsDeleting(true);
      const loadingToast = toast.loading("Deleting lounge pass...");
      
      const encodedSheetName = encodeURIComponent("stock-lounge-passes");
      await api.delete(`${encodedSheetName}/lounge_pass_id/${passToDelete}`);
      
      toast.dismiss(loadingToast);
      setSuccessMessage("Lounge pass deleted successfully!");
      setShowSuccessDialog(true);
      setShowDeleteConfirm(false);
      await fetchInitialData();
    } catch (error) {
      console.error("Failed to delete lounge pass:", error);
      toast.error(error.response?.data?.error || "Failed to delete lounge pass. Please try again.");
    } finally {
      setIsDeleting(false);
      setPassToDelete(null);
    }
  };

  // Apply filters and calculate pagination
  const totalPages = Math.ceil(filteredPasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredPasses.slice(startIndex, endIndex);

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
        Loading lounge passes...
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
              placeholder="Search lounge passes..."
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
          value={filters.variant}
          onValueChange={(value) => setFilters({ ...filters, variant: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Variant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Variants</SelectItem>
            {getUniqueVariants().map((variant) => (
              <SelectItem key={variant} value={variant}>
                {variant}
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
            Add Lounge Pass
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Variant</TableHead>
              <TableHead className="text-xs py-2">Used</TableHead>
              <TableHead className="text-xs py-2">Cost</TableHead>
              <TableHead className="text-xs py-2">Margin</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              const isEditing = editingCell.rowId === item.lounge_pass_id;
              return (
                <TableRow key={item.lounge_pass_id} className="hover:bg-muted/50">
                  <TableCell className="text-xs py-1.5 font-medium">{item.event}</TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "variant" ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.lounge_pass_id, "variant")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(item.lounge_pass_id, "variant");
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.lounge_pass_id, "variant", item.variant)}
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        {item.variant}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "used" ? (
                      <Input
                        type="number"
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.lounge_pass_id, "used")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(item.lounge_pass_id, "used");
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.lounge_pass_id, "used", item.used)}
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        {item.used}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "cost" ? (
                      <Input
                        type="number"
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.lounge_pass_id, "cost")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(item.lounge_pass_id, "cost");
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.lounge_pass_id, "cost", item.cost)}
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        £{item.cost}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {isEditing && editingCell.field === "margin" ? (
                      <Input
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={() => handleCellSave(item.lounge_pass_id, "margin")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(item.lounge_pass_id, "margin");
                          if (e.key === "Escape") handleCellCancel();
                        }}
                        autoFocus
                        className="h-7 text-xs"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.lounge_pass_id, "margin", item.margin)}
                        className="cursor-pointer hover:bg-muted/50 px-1 rounded"
                      >
                        {item.margin}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPass(item);
                          setIsEditDialogOpen(true);
                        }}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePass(item.lounge_pass_id)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredPasses.length)}{" "}
          of {filteredPasses.length} items
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
            setEditingPass(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Lounge Pass" : "Add New Lounge Pass"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the lounge pass details"
                : "Fill in the details for the new lounge pass"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event">Event</Label>
                <Combobox
                  options={events.map((event) => ({
                    value: event.event,
                    label: event.event,
                  }))}
                  value={isEditDialogOpen ? editingPass?.event : newPass.event}
                  onChange={(value) => {
                    if (isEditDialogOpen) {
                      setEditingPass((prev) => ({ ...prev, event: value }));
                    } else {
                      setNewPass((prev) => ({ ...prev, event: value }));
                    }
                  }}
                  placeholder="Select event"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant">Variant</Label>
                <Select
                  value={isEditDialogOpen ? editingPass?.variant : newPass.variant}
                  onValueChange={(value) => {
                    if (isEditDialogOpen) {
                      setEditingPass((prev) => ({ ...prev, variant: value }));
                    } else {
                      setNewPass((prev) => ({ ...prev, variant: value }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Airport Lounge Pass included (Departure only)">
                      Departure only
                    </SelectItem>
                    <SelectItem value="Airport Lounge Pass included (Departure & Return)">
                      Departure & Return
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (£)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={isEditDialogOpen ? editingPass?.cost : newPass.cost}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (isEditDialogOpen) {
                      setEditingPass((prev) => ({
                        ...prev,
                        cost: value
                      }));
                    } else {
                      setNewPass((prev) => ({
                        ...prev,
                        cost: value
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin">Margin (%)</Label>
                <Input
                  id="margin"
                  type="number"
                  value={isEditDialogOpen ? editingPass?.margin?.replace('%', '') : newPass.margin?.replace('%', '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isEditDialogOpen) {
                      setEditingPass((prev) => ({
                        ...prev,
                        margin: `${value}%`
                      }));
                    } else {
                      setNewPass((prev) => ({
                        ...prev,
                        margin: `${value}%`
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
                setEditingPass(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isEditDialogOpen) {
                  handleEditPass(editingPass);
                } else {
                  handleAddPass(newPass);
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
                "Update Lounge Pass"
              ) : (
                "Add Lounge Pass"
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
            setPassToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lounge pass.
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

export { LoungePassTable };
