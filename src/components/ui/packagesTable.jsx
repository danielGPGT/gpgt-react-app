import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Plus, Trash2, Pencil, Loader2, CheckCircle2, Eye, ChevronDown, Calendar, Globe, Package, Medal, Crown, Star, Trophy, Gem, Award, XCircle, Clock } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse } from "date-fns";
import { TiersTableView } from "@/components/ui/tiers-table-view";
import { TierDialog } from "@/components/ui/tier-dialog";
import { v4 as uuidv4 } from 'uuid';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Add tier configuration
const tierConfig = {
  Bronze: {
    icon: Medal,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200"
  },
  Silver: {
    icon: Star,
    color: "text-gray-400",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200"
  },
  Gold: {
    icon: Trophy,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-200"
  },
  Diamond: {
    icon: Gem,
    color: "text-blue-400",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200"
  },
  Platinum: {
    icon: Award,
    color: "text-slate-400",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200"
  },
  VIP: {
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200"
  }
};

// Update TierBadge component to use Trash2 icon for delete
const TierBadge = ({ tier, onEdit, onDelete }) => {
  const config = tierConfig[tier.tier_type] || {
    icon: Package,
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200"
  };
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className={`p-2 rounded-full border ${config.bgColor} ${config.borderColor} hover:opacity-80 transition-opacity cursor-pointer`}
              onClick={() => onEdit(tier)}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
            </Button>
            {/* Delete button - top right */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-0.5 -right-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity min-w-0 h-4 w-4 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tier);
              }}
            >
              <Trash2 className="h-full w-full p-0.5" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tier.tier_type}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

function PackagesTable() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [eventFilter, setEventFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isTiersDialogOpen, setIsTiersDialogOpen] = useState(false);
  const [packageTiers, setPackageTiers] = useState([]);
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isTierAddDialogOpen, setIsTierAddDialogOpen] = useState(false);
  const [isTierEditDialogOpen, setIsTierEditDialogOpen] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [isBulkTierUpdating, setIsBulkTierUpdating] = useState(false);
  const [showBulkTierActionsMenu, setShowBulkTierActionsMenu] = useState(false);
  const [tierToDelete, setTierToDelete] = useState(null);
  const [isDeletingTier, setIsDeletingTier] = useState(false);
  const [showTierDeleteDialog, setShowTierDeleteDialog] = useState(false);

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

  // Memoized fetch functions
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [packagesRes, tiersRes] = await Promise.all([
        api.get("/packages"),
        api.get("/package-tiers")
      ]);
      setPackages(packagesRes.data);
      setPackageTiers(tiersRes.data);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      setError("Failed to fetch packages. Please try again.");
      toast.error("Failed to load packages", {
        description: "There was an error loading the packages. Please refresh the page."
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      toast.error("Failed to load events", {
        description: "Some features may be limited until events are loaded."
      });
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    Promise.all([fetchPackages(), fetchEvents()]).catch(error => {
      console.error("Error during initial data fetch:", error);
    });
  }, [fetchPackages, fetchEvents]);

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
      const statusMatch = statusFilter === "all" || pkg.status === statusFilter;
      const searchMatch = searchQuery === "" || 
        pkg.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.package_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.url && pkg.url.toLowerCase().includes(searchQuery.toLowerCase()));
      return eventMatch && typeMatch && statusMatch && searchMatch;
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
  }, [packages, eventFilter, typeFilter, statusFilter, sortColumn, sortDirection, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [eventFilter, typeFilter, statusFilter, searchQuery]);

  // Update initialPackageState to only include required fields
  const initialPackageState = {
    event_id: "",
    package_id: "",
    package_type: "",
    url: "",
    payment_date_1: "",
    payment_date_2: "",
    payment_date_3: ""
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
      event_id: pkg.event_id,
      package_id: pkg.package_id,
      package_type: pkg.package_type,
      url: pkg.url || "",
      payment_date_1: parseDateFromAPI(pkg.payment_date_1),
      payment_date_2: parseDateFromAPI(pkg.payment_date_2),
      payment_date_3: parseDateFromAPI(pkg.payment_date_3)
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
  const validateField = useCallback((field, value) => {
    const errors = { ...formErrors };
    
    // Handle different types of values
    if (value === null || value === undefined) {
      errors[field] = "Required";
    } else if (typeof value === 'string') {
      if (value.trim() === "") {
        errors[field] = "Required";
      } else {
        delete errors[field];
      }
    } else if (typeof value === 'number') {
      if (isNaN(value)) {
        errors[field] = "Invalid number";
      } else {
        delete errors[field];
      }
    } else if (typeof value === 'boolean') {
      delete errors[field];
    } else {
      delete errors[field];
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formErrors]);
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

  // Update handleAddPackage function
  const handleAddPackage = async () => {
    // Validate required fields
    const errors = {};
    if (!formData.event_id) errors.event_id = "Event is required";
    if (!formData.package_type) errors.package_type = "Package type is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    // Check for duplicate package
    const isDuplicate = packages.some(
      (pkg) =>
        pkg.event_id === formData.event_id &&
        pkg.package_type === formData.package_type
    );

    if (isDuplicate) {
      const errorMessage = `A ${formData.package_type} package already exists for this event`;
      setFormErrors({ api: errorMessage });
      toast.error(errorMessage, {
        duration: 5000,
        description: "Please choose a different package type for this event"
      });
      return;
    }

    setIsAdding(true);
    try {
      const payload = {
        package_id: uuidv4(),
        event_id: formData.event_id,
        package_type: formData.package_type,
        url: formData.url || "",
        payment_date_1: formatDateForAPI(paymentDate1),
        payment_date_2: formatDateForAPI(paymentDate2),
        payment_date_3: formatDateForAPI(paymentDate3)
      };

      // Optimistically update the local state
      setPackages(prev => [...prev, payload]);

      await api.post("/packages", payload);
      
      toast.success("Package added successfully!");
      setIsAddDialogOpen(false);
      resetFormData();
      fetchPackages();
    } catch (error) {
      console.error("Failed to add package:", error);
      
      // Revert optimistic update
      fetchPackages();
      
      const errorMessage = error.response?.data?.message || "Failed to add package. Please try again.";
      setFormErrors({ api: errorMessage });
      toast.error(errorMessage, {
        description: "There was an error processing your request"
      });
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
        pkg.event_id === formData.event_id &&
        pkg.package_type === formData.package_type &&
        pkg.package_id !== editingPackage.package_id
    );

    if (isDuplicate) {
      setFormErrors({
        api: `A ${formData.package_type} package already exists for this event`,
      });
      return;
    }

    if (!validateField("event_id", formData.event_id)) return;
    setIsEditing(true);
    try {
      // Compare with original package to find changed fields
      const updates = Object.entries(formData)
        .filter(([key, value]) => {
          const originalValue = editingPackage[key];
          
          // Special handling for payment dates
          if (key.startsWith('payment_date_')) {
            const newValue = formatDateForAPI(
              key === 'payment_date_1' ? paymentDate1 :
              key === 'payment_date_2' ? paymentDate2 :
              paymentDate3
            );
            return newValue !== originalValue;
          }
          
          // Handle null/undefined/empty string cases
          if (originalValue === null && value === "") return false;
          if (originalValue === "" && value === null) return false;
          
          return originalValue !== value;
        })
        .map(([key, value]) => ({
          column: key,
          value: key.startsWith('payment_date_') 
            ? formatDateForAPI(
                key === 'payment_date_1' ? paymentDate1 :
                key === 'payment_date_2' ? paymentDate2 :
                paymentDate3
              )
            : value === null ? "" : value.toString()
        }));

      if (updates.length === 0) {
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        return;
      }

      // Optimistically update the local state
      const updatedPackage = {
        ...editingPackage,
        ...Object.fromEntries(updates.map(({ column, value }) => [column, value]))
      };
      setPackages(prev => 
        prev.map(pkg => 
          pkg.package_id === editingPackage.package_id ? updatedPackage : pkg
        )
      );

      // Make bulk update request
      await api.put(`/packages/package_id/${editingPackage.package_id}/bulk`, updates);

      toast.success("Package updated successfully!", {
        description: `Changes to this package have been saved`
      });
      setIsEditDialogOpen(false);
      
      // Refresh packages to ensure consistency
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to update package:", error);
      
      let errorMessage = "Failed to update package. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = "Package not found. It may have been deleted.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setFormErrors({ api: errorMessage });
      toast.error(errorMessage, {
        description: "There was an error processing your request"
      });
      
      // Revert optimistic update on error
      const res = await api.get("/packages");
      setPackages(res.data);
    } finally {
      setIsEditing(false);
    }
  };
  // Delete package
  const confirmDelete = async () => {
    if (!packageToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/packages/package_id/${packageToDelete.package_id}`);
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

  // Add bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedPackages.length === 0) return;

    setIsBulkDeleting(true);
    try {
      // Delete packages concurrently with a concurrency limit
      const concurrencyLimit = 3;
      const chunks = [];
      for (let i = 0; i < selectedPackages.length; i += concurrencyLimit) {
        chunks.push(selectedPackages.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(packageId =>
            api.delete(`/packages/package_id/${packageId}`)
          )
        );
      }

      toast.success("Packages deleted successfully!", {
        description: `${selectedPackages.length} package(s) have been removed`
      });
      
      setSelectedPackages([]);
      fetchPackages();
    } catch (error) {
      console.error("Failed to delete packages:", error);
      toast.error("Failed to delete some packages", {
        description: "There was an error processing your request. Please try again."
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleViewTiers = (pkg) => {
    setSelectedPackage(pkg);
    setIsTiersDialogOpen(true);
  };

  // Reset form data helper
  const resetFormData = useCallback(() => {
    setFormData(initialPackageState);
    setFormErrors({});
    setPaymentDate1(null);
    setPaymentDate2(null);
    setPaymentDate3(null);
  }, []);

  // Enhanced bulk actions
  const handleBulkAction = async (action, value) => {
    if (selectedPackages.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const updates = selectedPackages.map(packageId => ({
        package_id: packageId,
        updates: [{
          column: action,
          value: value
        }]
      }));

      // Process updates in chunks to avoid overwhelming the server
      const concurrencyLimit = 3;
      const chunks = [];
      for (let i = 0; i < updates.length; i += concurrencyLimit) {
        chunks.push(updates.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(update =>
            api.put(`/packages/package_id/${update.package_id}/bulk`, update.updates)
          )
        );
      }

      toast.success("Bulk update successful!", {
        description: `Updated ${selectedPackages.length} package(s)`
      });

      setSelectedPackages([]);
      fetchPackages();
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      toast.error("Failed to update packages", {
        description: "There was an error processing your request"
      });
    } finally {
      setIsBulkUpdating(false);
      setShowBulkActionsMenu(false);
    }
  };

  // Add fetchTiers function
  const fetchTiers = useCallback(async () => {
    try {
      const res = await api.get("/package-tiers");
      setPackageTiers(res.data);
    } catch (error) {
      console.error("Failed to fetch tiers:", error);
      toast.error("Failed to load tiers");
    }
  }, []);

  // Add useEffect to fetch tiers
  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Add bulk tier handlers
  const handleSelectAllTiers = (checked) => {
    if (checked) {
      setSelectedTiers(packageTiers
        .filter(tier => tier.package_id === selectedPackage?.package_id)
        .map(tier => tier.tier_id));
    } else {
      setSelectedTiers([]);
    }
  };

  const handleSelectTier = (tierId, checked) => {
    if (checked) {
      setSelectedTiers(prev => [...prev, tierId]);
    } else {
      setSelectedTiers(prev => prev.filter(id => id !== tierId));
    }
  };

  const handleBulkTierAction = async (action, value) => {
    if (selectedTiers.length === 0) return;

    setIsBulkTierUpdating(true);
    try {
      const updates = selectedTiers.map(tierId => ({
        tier_id: tierId,
        updates: [{
          column: action,
          value: value
        }]
      }));

      // Process updates in chunks to avoid overwhelming the server
      const concurrencyLimit = 3;
      const chunks = [];
      for (let i = 0; i < updates.length; i += concurrencyLimit) {
        chunks.push(updates.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(update =>
            api.put(`/package-tiers/tier_id/${update.tier_id}/bulk`, update.updates)
          )
        );
      }

      toast.success("Bulk update successful!", {
        description: `Updated ${selectedTiers.length} tier(s)`
      });

      setSelectedTiers([]);
      await fetchTiers();
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      toast.error("Failed to update tiers", {
        description: "There was an error processing your request"
      });
    } finally {
      setIsBulkTierUpdating(false);
      setShowBulkTierActionsMenu(false);
    }
  };

  // Add tier delete handler
  const handleDeleteTier = async () => {
    if (!tierToDelete) return;
    setIsDeletingTier(true);
    try {
      await api.delete(`/package-tiers/tier_id/${tierToDelete.tier_id}`);
      toast.success("Tier deleted successfully!");
      await fetchTiers();
      const res = await api.get("/packages");
      setPackages(res.data);
    } catch (error) {
      console.error("Failed to delete tier:", error);
      toast.error("Failed to delete tier", {
        description: "There was an error processing your request"
      });
    } finally {
      setIsDeletingTier(false);
      setTierToDelete(null);
      setShowTierDeleteDialog(false);
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
        </div>
        <div className="flex gap-2">
          {selectedPackages.length > 0 && (
            <DropdownMenu open={showBulkActionsMenu} onOpenChange={setShowBulkActionsMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isBulkUpdating}
                  className="flex items-center gap-2"
                >
                  {isBulkUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      Bulk Actions ({selectedPackages.length})
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Update Package Type</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleBulkAction('package_type', 'VIP')}>
                  <Package className="mr-2 h-4 w-4" />
                  Set as VIP
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('package_type', 'Grandstand')}>
                  <Package className="mr-2 h-4 w-4" />
                  Set as Grandstand
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Package
          </Button>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="w-[50px] text-xs py-2">
                <Checkbox
                  checked={selectedPackages.length === currentItems.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Package Name</TableHead>
              <TableHead className="text-xs py-2">Type</TableHead>
              <TableHead className="text-xs py-2">Payment Schedule</TableHead>
              <TableHead className="text-xs py-2">Status</TableHead>
              <TableHead className="text-xs py-2">URL</TableHead>
              <TableHead className="text-xs py-2">Tiers</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((pkg) => (
                <TableRow key={pkg.package_id} className="hover:bg-muted/50">
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
                  <TableCell className="text-xs py-1.5">{pkg.event}</TableCell>
                  <TableCell className="text-xs py-1.5">{pkg.package_name}</TableCell>
                  <TableCell className="text-xs py-1.5">{pkg.package_type}</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex items-center gap-1.5">
                      {pkg.payment_date_1 && (
                        <Badge variant="outline" className="text-xs">
                          1st: {pkg.payment_date_1}
                        </Badge>
                      )}
                      {pkg.payment_date_2 && (
                        <Badge variant="outline" className="text-xs">
                          2nd: {pkg.payment_date_2}
                        </Badge>
                      )}
                      {pkg.payment_date_3 && (
                        <Badge variant="outline" className="text-xs">
                          3rd: {pkg.payment_date_3}
                        </Badge>
                      )}
                      {!pkg.payment_date_1 && !pkg.payment_date_2 && !pkg.payment_date_3 && (
                        <span className="text-muted-foreground text-xs">No payment schedule</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <Badge
                      variant="outline"
                      className={`${
                        pkg.status === "sales closed"
                          ? "bg-destructive/10 text-destructive"
                          : pkg.status === "sales open"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {pkg.status}
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
                    <div className="flex items-center gap-1">
                      {packageTiers
                        .filter(tier => tier.package_id === pkg.package_id)
                        .map(tier => (
                          <TierBadge 
                            key={tier.tier_id} 
                            tier={tier} 
                            onEdit={(tier) => {
                              setSelectedPackage(pkg);
                              setSelectedTier(tier);
                              setIsTierEditDialogOpen(true);
                            }}
                            onDelete={(tier) => {
                              setTierToDelete(tier);
                              setShowTierDeleteDialog(true);
                            }}
                          />
                        ))}
                      {packageTiers.filter(tier => tier.package_id === pkg.package_id).length < 3 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="p-2 rounded-full border bg-primary/10 hover:bg-primary/20 transition-colors"
                                onClick={() => {
                                  setSelectedPackage(pkg);
                                  setIsTierAddDialogOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add Tier</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
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
                        {isDeleting && packageToDelete?.package_id === pkg.package_id ? (
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
                  colSpan={8}
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
                        value: event.event_id,
                        label: event.event,
                      })),
                    ]}
                    value={formData.event_id}
                    onChange={(value) => {
                      if (value) {
                        handleFieldChange("event_id", value);
                      }
                    }}
                    placeholder="Select event"
                    className="w-full"
                  />
                  {formErrors.event_id && (
                    <p className="text-sm text-red-500">{formErrors.event_id}</p>
                  )}
                </div>
              )}
              {/* Edit Dialog: Event and Package Name (read-only) */}
              {isEditDialogOpen && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="event">Event</Label>
                    <Input
                      id="event"
                      value={editingPackage?.event || ""}
                      disabled
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="package_name">Package Name</Label>
                    <Input
                      id="package_name"
                      value={editingPackage?.package_name || ""}
                      disabled
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </>
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
      {selectedPackage && (
        <>
          <TierDialog
            isOpen={isTierAddDialogOpen}
            onOpenChange={setIsTierAddDialogOpen}
            mode="add"
            package={selectedPackage}
            onSuccess={async () => {
              await fetchTiers();
              const res = await api.get("/packages");
              setPackages(res.data);
              setIsTierAddDialogOpen(false);
            }}
          />
          <TierDialog
            isOpen={isTierEditDialogOpen}
            onOpenChange={setIsTierEditDialogOpen}
            mode="edit"
            tier={selectedTier}
            package={selectedPackage}
            onSuccess={async () => {
              await fetchTiers();
              const res = await api.get("/packages");
              setPackages(res.data);
              setIsTierEditDialogOpen(false);
            }}
          />
        </>
      )}
      {/* Tier Delete Dialog */}
      <AlertDialog open={showTierDeleteDialog} onOpenChange={setShowTierDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTier}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTier}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingTier}
            >
              {isDeletingTier ? (
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
    </div>
  );
}

export { PackagesTable };
