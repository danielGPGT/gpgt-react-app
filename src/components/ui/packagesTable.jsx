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
import { Plus, Trash2, Pencil, Loader2, CheckCircle2 } from "lucide-react";
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
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";

function PackagesTable() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [eventFilter, setEventFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Sorting options
  const sortColumns = [
    { value: "event", label: "Event" },
    { value: "package_name", label: "Package Name" },
    { value: "package_type", label: "Type" },
    { value: "url", label: "URL" },
  ];
  const [sortColumn, setSortColumn] = useState("event");
  const [sortDirection, setSortDirection] = useState("asc");

  // Add state for payment dates
  const [paymentDate1, setPaymentDate1] = useState(null);
  const [paymentDate2, setPaymentDate2] = useState(null);
  const [paymentDate3, setPaymentDate3] = useState(null);

  useEffect(() => {
    async function fetchPackages() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/packages");
        setPackages(res.data);
      } catch (err) {
        setError("Failed to fetch packages.");
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await api.get("/event");
        setEvents(res.data);
      } catch (err) {
        // ignore for now
      }
    }
    fetchEvents();
  }, []);

  // Unique event and type options
  const eventOptions = useMemo(() => {
    const unique = Array.from(new Set(packages.map((p) => p.event)));
    return unique.filter(Boolean).sort();
  }, [packages]);
  const typeOptions = useMemo(() => {
    const unique = Array.from(new Set(packages.map((p) => p.package_type)));
    return unique.filter(Boolean).sort();
  }, [packages]);

  // Filtered and sorted packages
  const filteredPackages = useMemo(() => {
    let result = packages.filter((pkg) => {
      const eventMatch = eventFilter === "all" || pkg.event === eventFilter;
      const typeMatch = typeFilter === "all" || pkg.package_type === typeFilter;
      const searchMatch = searchQuery === "" || 
        pkg.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.package_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.url && pkg.url.toLowerCase().includes(searchQuery.toLowerCase()));
      return eventMatch && typeMatch && searchMatch;
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
  }, [packages, eventFilter, typeFilter, sortColumn, sortDirection, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [eventFilter, typeFilter, searchQuery]);

  // Add/Edit form state
  const initialPackageState = {
    event: "",
    event_id: "",
    package_name: "",
    package_type: "",
    url: "",
    payment_date_1: "",
    payment_date_2: "",
    payment_date_3: "",
    package_status: "sales open"
  };
  const [formData, setFormData] = useState(initialPackageState);
  const [formErrors, setFormErrors] = useState({});

  // Add/Edit handlers
  const openAddDialog = () => {
    setFormData(initialPackageState);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };
  const openEditDialog = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      event: pkg.event,
      event_id: pkg.event_id,
      package_name: pkg.package_name,
      package_type: pkg.package_type,
      url: pkg.url || "",
      package_status: pkg.package_status || "sales open"
    });
    
    // Parse payment dates
    setPaymentDate1(parseDateFromAPI(pkg.payment_date_1));
    setPaymentDate2(parseDateFromAPI(pkg.payment_date_2));
    setPaymentDate3(parseDateFromAPI(pkg.payment_date_3));
    
    setFormErrors({});
    setIsEditDialogOpen(true);
  };
  const handleDeleteClick = (pkg) => {
    setPackageToDelete(pkg);
    setShowDeleteDialog(true);
  };

  // Validate form fields
  const validateField = (field, value) => {
    console.log(`Validating ${field}:`, value); // Debug log
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
    console.log(`Field change - ${field}:`, value); // Debug log
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log("New form data:", newData); // Debug log
      return newData;
    });
    validateField(field, value);
  };

  // Function to format date for API
  const formatDateForAPI = (date) => {
    if (!date) return "";
    if (date === "upfront") return "upfront";
    return format(date, "1-MMM-yyyy");
  };

  // Function to parse date from API
  const parseDateFromAPI = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr === "upfront") return "upfront";
    return parse(dateStr, "1-MMM-yyyy", new Date());
  };

  // Add package
  const handleAddPackage = async () => {
    console.log("Form data before validation:", formData); // Debug log

    // Check for duplicate package
    const isDuplicate = packages.some(
      (pkg) =>
        pkg.event === formData.event &&
        pkg.package_type === formData.package_type
    );

    if (isDuplicate) {
      setFormErrors({
        api: `A ${formData.package_type} package already exists for ${formData.event}`,
      });
      return;
    }

    if (!validateField("event", formData.event)) return;
    setIsAdding(true);
    try {
      const { package_name, event_id, ...addData } = formData;
      const payload = {
        ...addData,
        event: formData.event,
        package_status: formData.package_status || "sales open",
        payment_date_1: formatDateForAPI(paymentDate1),
        payment_date_2: formatDateForAPI(paymentDate2),
        payment_date_3: formatDateForAPI(paymentDate3)
      };
      console.log("Sending payload to API:", payload);
      await api.post("/packages", payload);
      setSuccessMessage("Package added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
      // Refresh
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (error) {
      console.error("Error adding package:", error);
      setFormErrors({ api: "Failed to add package" });
    } finally {
      setIsAdding(false);
    }
  };
  // Edit package
  const handleEditPackage = async () => {
    if (!editingPackage) return;

    // Check for duplicate package (excluding the current package being edited)
    const isDuplicate = packages.some(
      (pkg) =>
        pkg.event === formData.event &&
        pkg.package_type === formData.package_type &&
        pkg.package_id !== editingPackage.package_id
    );

    if (isDuplicate) {
      setFormErrors({
        api: `A ${formData.package_type} package already exists for ${formData.event}`,
      });
      return;
    }

    if (!validateField("event", formData.event)) return;
    setIsEditing(true);
    try {
      const changedFields = {};

      if (formData.package_type !== editingPackage.package_type) {
        changedFields["package_type"] = formData.package_type;
      }

      if (formData.package_status !== editingPackage.package_status) {
        changedFields["package_status"] = formData.package_status;
      }

      // Add payment date changes
      const newPaymentDate1 = formatDateForAPI(paymentDate1);
      const newPaymentDate2 = formatDateForAPI(paymentDate2);
      const newPaymentDate3 = formatDateForAPI(paymentDate3);

      if (newPaymentDate1 !== editingPackage.payment_date_1) {
        changedFields["payment_date_1"] = newPaymentDate1;
      }
      if (newPaymentDate2 !== editingPackage.payment_date_2) {
        changedFields["payment_date_2"] = newPaymentDate2;
      }
      if (newPaymentDate3 !== editingPackage.payment_date_3) {
        changedFields["payment_date_3"] = newPaymentDate3;
      }

      // Only update if there are changes
      if (Object.keys(changedFields).length === 0) {
        setSuccessMessage("No changes were made");
        setShowSuccessDialog(true);
        setIsEditDialogOpen(false);
        return;
      }

      // Update only changed fields
      for (const [column, value] of Object.entries(changedFields)) {
        await api.put(`/packages/Package ID/${editingPackage.package_id}`, {
          column,
          value,
        });
      }

      setSuccessMessage("Package updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      // Refresh
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to update package:", error);
      setFormErrors({ api: "Failed to update package" });
    } finally {
      setIsEditing(false);
    }
  };
  // Delete package
  const confirmDelete = async () => {
    if (!packageToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/packages/Package ID/${packageToDelete.package_id}`);
      setSuccessMessage("Package deleted successfully!");
      setShowSuccessDialog(true);
      setShowDeleteDialog(false);
      // Refresh
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to delete package:", error);
      setFormErrors({ api: "Failed to delete package" });
    } finally {
      setIsDeleting(false);
      setPackageToDelete(null);
    }
  };

  // Add bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPackages(currentItems.map((pkg) => pkg.package_id));
    } else {
      setSelectedPackages([]);
    }
  };

  const handleSelectPackage = (packageId, checked) => {
    if (checked) {
      setSelectedPackages((prev) => [...prev, packageId]);
    } else {
      setSelectedPackages((prev) => prev.filter((id) => id !== packageId));
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedPackages([]); // Clear selection when toggling mode
  };

  // Add bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedPackages.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete packages one by one
      for (const packageId of selectedPackages) {
        await api.delete(`/packages/Package ID/${packageId}`);
      }

      setSuccessMessage(
        `${selectedPackages.length} package(s) deleted successfully!`
      );
      setShowSuccessDialog(true);
      setSelectedPackages([]);

      // Refresh the packages list
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to delete packages:", error);
      toast.error("Failed to delete some packages");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Loading packages...
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-destructive">{error}</div>;
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredPackages.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="flex items-end gap-2 justify-between">
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
          <Combobox
            options={[
              { value: "all", label: "All Events" },
              ...eventOptions.map((event) => ({ value: event, label: event })),
            ]}
            value={eventFilter}
            onChange={setEventFilter}
            placeholder="Filter by Event"
            className="w-[300px]"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {typeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isSelectionMode && selectedPackages.length > 0 && (
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
                Delete Selected ({selectedPackages.length})
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
            Add Package
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              {isSelectionMode && (
                <TableHead className="w-[50px] text-xs py-2">
                  <Checkbox
                    checked={selectedPackages.length === currentItems.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Package Name</TableHead>
              <TableHead className="text-xs py-2">Type</TableHead>
              <TableHead className="text-xs py-2">Payment Schedule</TableHead>
              <TableHead className="text-xs py-2">Status</TableHead>
              <TableHead className="text-xs py-2">URL</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((pkg) => (
                <TableRow key={pkg.package_id} className="hover:bg-muted/50">
                  {isSelectionMode && (
                    <TableCell className="text-xs py-1.5">
                      <Checkbox
                        checked={selectedPackages.includes(pkg.package_id)}
                        onCheckedChange={(checked) =>
                          handleSelectPackage(pkg.package_id, checked)
                        }
                        aria-label={`Select ${pkg.package_name}`}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-xs py-1.5">{pkg.event}</TableCell>
                  <TableCell className="text-xs py-1.5">{pkg.package_name}</TableCell>
                  <TableCell className="text-xs py-1.5">{pkg.package_type}</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="space-y-1">
                      {pkg.payment_date_1 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">1st:</span>
                          <span>{pkg.payment_date_1}</span>
                        </div>
                      )}
                      {pkg.payment_date_2 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">2nd:</span>
                          <span>{pkg.payment_date_2}</span>
                        </div>
                      )}
                      {pkg.payment_date_3 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">3rd:</span>
                          <span>{pkg.payment_date_3}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <Badge
                      variant="outline"
                      className={`${
                        pkg.package_status === "sales closed"
                          ? "bg-destructive/10 text-destructive"
                          : pkg.package_status === "sales open"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {pkg.package_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {pkg.url ? (
                      <a
                        href={pkg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline font-medium"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(pkg)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(pkg)}
                        disabled={isDeleting}
                        className="h-7 w-7"
                      >
                        {isDeleting &&
                        packageToDelete?.package_id === pkg.package_id ? (
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
                  colSpan={isSelectionMode ? 8 : 7}
                  className="text-center text-muted-foreground text-xs py-1.5"
                >
                  No packages found.
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
          {Math.min(endIndex, filteredPackages.length)} of{" "}
          {filteredPackages.length} packages
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingPackage(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Package" : "Add New Package"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the package details"
                : "Fill in the details for the new package"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 relative max-h-[calc(90vh-200px)] overflow-y-auto">
            {(isAdding || isEditing) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {isEditDialogOpen
                      ? "Updating Package..."
                      : "Adding Package..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your request
                  </p>
                </div>
              </div>
            )}
            <div
              className={
                isAdding || isEditing
                  ? "opacity-50 pointer-events-none"
                  : "space-y-4"
              }
            >
              {/* Add Dialog: Event (Combobox) */}
              {!isEditDialogOpen && (
                <div className="space-y-2">
                  <Label htmlFor="event">Event</Label>
                  <Combobox
                    options={[
                      { value: "", label: "Select Event" },
                      ...events.map((event) => ({
                        value: event.event,
                        label: event.event,
                      })),
                    ]}
                    value={formData.event}
                    onChange={(value) => {
                      console.log("Combobox selected value:", value); // Debug log
                      if (value) {
                        handleFieldChange("event", value);
                      }
                    }}
                    placeholder="Select event"
                    className="w-full"
                  />
                  {formErrors.event && (
                    <p className="text-sm text-red-500">{formErrors.event}</p>
                  )}
                </div>
              )}
              {/* Edit Dialog: Event (read-only) */}
              {isEditDialogOpen && (
                <div className="space-y-2">
                  <Label htmlFor="event">Event</Label>
                  <Input
                    id="event"
                    value={formData.event || ""}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                </div>
              )}
              {/* Edit Dialog: Package Name (read-only) */}
              {isEditDialogOpen && (
                <div className="space-y-2">
                  <Label htmlFor="package_name">Package Name</Label>
                  <Input
                    id="package_name"
                    value={formData.package_name}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                </div>
              )}
              {/* Type (Select) */}
              <div className="space-y-2">
                <Label htmlFor="package_type">Package Type</Label>
                <Select
                  value={formData.package_type}
                  onValueChange={(value) =>
                    handleFieldChange("package_type", value)
                  }
                  disabled={isAdding || isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Grandstand">Grandstand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleFieldChange("url", e.target.value)}
                  disabled={isAdding || isEditing}
                  placeholder="https://..."
                />
              </div>
              {/* Payment Schedule */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Payment Schedule</h4>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_date_1">First Payment</Label>
                    <DatePicker
                      date={paymentDate1}
                      setDate={setPaymentDate1}
                      disabled={isAdding || isEditing}
                      isFirstPayment={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date_2">Second Payment</Label>
                    <DatePicker
                      date={paymentDate2}
                      setDate={setPaymentDate2}
                      disabled={isAdding || isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_date_3">Third Payment</Label>
                    <DatePicker
                      date={paymentDate3}
                      setDate={setPaymentDate3}
                      disabled={isAdding || isEditing}
                    />
                  </div>
                </div>
              </div>
              {/* Package Status */}
              <div className="space-y-2">
                <Label htmlFor="package_status">Package Status</Label>
                <Select
                  value={formData.package_status}
                  onValueChange={(value) => handleFieldChange("package_status", value)}
                  disabled={isAdding || isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales open">Sales Open</SelectItem>
                    <SelectItem value="sales closed">Sales Closed</SelectItem>
                    <SelectItem value="coming soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formErrors.api && (
                <div className="text-sm text-destructive text-center">
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
                setEditingPackage(null);
              }}
              disabled={isAdding || isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEditPackage : handleAddPackage}
              disabled={isAdding || isEditing}
              className="min-w-[100px]"
            >
              {isAdding || isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditDialogOpen ? "Updating..." : "Adding..."}
                </>
              ) : isEditDialogOpen ? (
                "Update Package"
              ) : (
                "Add Package"
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
              package "{packageToDelete?.package_name}".
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
                  Deleting Package...
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
              {selectedPackages.length} selected package(s).
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

export { PackagesTable };
