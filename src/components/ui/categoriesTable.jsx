import { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, ChevronDown, Sparkles } from "lucide-react";
import api, { fetchCategoryInfo } from "@/lib/api";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CategoriesTable() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageTypeFilter, setPackageTypeFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [venues, setVenues] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);

  // Sorting options
  const sortColumns = [
    { value: "venue_name", label: "Venue" },
    { value: "category_name", label: "Category Name" },
    { value: "package_type", label: "Package Type" },
    { value: "ticket_delivery_days", label: "Delivery Days" },
  ];
  const [sortColumn, setSortColumn] = useState("venue_name");
  const [sortDirection, setSortDirection] = useState("asc");

  const [formData, setFormData] = useState({
    venue_id: "",
    category_name: "",
    gpgt_category_name: "",
    package_type: "",
    ticket_delivery_days: 14,
    video_wall: false,
    covered_seat: false,
    numbered_seat: false,
    category_info: "",
    ticket_image_1: "",
    ticket_image_2: "",
  });

  // Unique venues from categories with names from venues endpoint (for table filter)
  const uniqueVenues = useMemo(() => {
    const venueIds = [...new Set(categories.map(cat => cat.venue_id))];
    return venueIds
      .map(id => {
        const venue = venues.find(v => v.venue_id === id);
        return venue ? {
          venue_id: id,
          venue_name: venue.venue_name
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.venue_name.localeCompare(b.venue_name));
  }, [categories, venues]);

  // All venues sorted by name (for forms)
  const allVenues = useMemo(() => {
    return [...venues]
      .sort((a, b) => a.venue_name.localeCompare(b.venue_name));
  }, [venues]);

  // Fetch categories and venues
  useEffect(() => {
    fetchCategories();
    fetchVenues();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");
      console.log("Categories response:", response.data);
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const response = await api.get("/venues");
      console.log("Venues response:", response.data);
      setVenues(response.data);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      toast.error("Failed to load venues");
    }
  };

  // Unique package type options
  const packageTypeOptions = useMemo(() => {
    const unique = Array.from(new Set(categories.map((c) => c.package_type)));
    return unique.filter(Boolean).sort();
  }, [categories]);

  // Filtered and sorted categories
  const filteredCategories = useMemo(() => {
    let result = categories.filter((cat) => {
      const typeMatch = packageTypeFilter === "all" || cat.package_type === packageTypeFilter;
      const venueMatch = venueFilter === "all" || cat.venue_id === venueFilter;
      const searchMatch = searchQuery === "" || 
        cat.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.package_type.toLowerCase().includes(searchQuery.toLowerCase());
      
      return typeMatch && venueMatch && searchMatch;
    });

    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal, bVal;
        
        if (sortColumn === "venue_name") {
          const venueA = uniqueVenues.find(v => v.venue_id === a.venue_id)?.venue_name || "";
          const venueB = uniqueVenues.find(v => v.venue_id === b.venue_id)?.venue_name || "";
          aVal = venueA.toLowerCase();
          bVal = venueB.toLowerCase();
        } else {
          aVal = (a[sortColumn] || "").toString().toLowerCase();
          bVal = (b[sortColumn] || "").toString().toLowerCase();
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [categories, uniqueVenues, packageTypeFilter, venueFilter, sortColumn, sortDirection, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [packageTypeFilter, venueFilter, searchQuery]);

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

  // Handle form input changes
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Handle switch changes
  const handleSwitchChange = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      venue_id: "",
      category_name: "",
      gpgt_category_name: "",
      package_type: "",
      ticket_delivery_days: 14,
      video_wall: false,
      covered_seat: false,
      numbered_seat: false,
      category_info: "",
      ticket_image_1: "",
      ticket_image_2: "",
    });
    setFormErrors({});
  };

  // Handle add category
  const handleAddCategory = async () => {
    // Validate required fields
    const errors = {};
    if (!formData.venue_id) errors.venue_id = "Venue is required";
    if (!formData.category_name) errors.category_name = "Category name is required";
    if (!formData.package_type) errors.package_type = "Package type is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    // Check for duplicate category
    const isDuplicate = categories.some(
      cat => cat.venue_id === formData.venue_id && 
             cat.category_name === formData.category_name
    );

    if (isDuplicate) {
      const errorMessage = `A category with name "${formData.category_name}" already exists for this venue`;
      setFormErrors({ api: errorMessage });
      toast.error(errorMessage, {
        duration: 5000,
        description: "Please choose a different category name for this venue"
      });
      return;
    }

    setIsAdding(true);
    try {
      const payload = {
        category_id: uuidv4(),
        venue_id: formData.venue_id,
        category_name: formData.category_name,
        gpgt_category_name: formData.gpgt_category_name || formData.category_name,
        package_type: formData.package_type,
        ticket_delivery_days: formData.ticket_delivery_days,
        video_wall: formData.video_wall,
        covered_seat: formData.covered_seat,
        numbered_seat: formData.numbered_seat,
        category_info: formData.category_info || "",
        ticket_image_1: formData.ticket_image_1 || "",
        ticket_image_2: formData.ticket_image_2 || ""
      };

      console.log("Adding category with payload:", payload);
      await api.post("/categories", payload);
      
      toast.success("Category added successfully!", {
        description: `${formData.category_name} has been added`
      });
      setShowAddDialog(false);
      resetFormData();
      fetchCategories();
    } catch (error) {
      console.error("Failed to add category:", error);
      const errorMessage = "Failed to add category. Please try again.";
      setFormErrors({ api: errorMessage });
      toast.error(errorMessage, {
        description: "There was an error processing your request"
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle edit category
  const handleEditCategory = async () => {
    if (!selectedCategory) return;

    // Validate required fields
    const errors = {};
    if (!formData.venue_id) errors.venue_id = "Venue is required";
    if (!formData.category_name) errors.category_name = "Category name is required";
    if (!formData.package_type) errors.package_type = "Package type is required";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    // Check for duplicate category (excluding the current category being edited)
    const isDuplicate = categories.some(
      cat => cat.venue_id === formData.venue_id && 
             cat.category_name === formData.category_name &&
             cat.category_id !== selectedCategory.category_id
    );

    if (isDuplicate) {
      const errorMessage = `A category with name "${formData.category_name}" already exists for this venue`;
      setFormErrors({ api: errorMessage });
      toast.error(errorMessage, {
        duration: 5000,
        description: "Please choose a different category name for this venue"
      });
      return;
    }

    setIsEditing(true);
    try {
      console.log('Original category:', selectedCategory);
      console.log('Form data:', formData);

      // Compare with original category to find changed fields
      const changedFields = {};
      Object.keys(formData).forEach(key => {
        const originalValue = selectedCategory[key];
        const newValue = formData[key];
        
        console.log(`Comparing ${key}:`, {
          original: originalValue,
          new: newValue,
          type: typeof newValue,
          isEqual: originalValue === newValue
        });

        // Special handling for ticket image fields
        if (key === 'ticket_image_1' || key === 'ticket_image_2') {
          // Only update if the value has changed and is a valid URL or empty string
          if (newValue !== originalValue) {
            // Validate URL format
            if (newValue === "" || isValidImageUrl(newValue)) {
              changedFields[key] = newValue;
            } else {
              console.warn(`Invalid image URL for ${key}:`, newValue);
              // Don't include invalid URLs in the update
            }
          }
        } else if (originalValue !== newValue) {
          // Format the value based on its type
          let value = newValue;
          if (typeof value === 'boolean') {
            value = value ? "TRUE" : "FALSE";
          } else if (value === null || value === undefined) {
            value = "";
          } else {
            value = value.toString();
          }
          changedFields[key] = value;
        }
      });

      console.log('Changed fields:', changedFields);

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes were made");
        setShowEditDialog(false);
        return;
      }

      // Update only changed fields
      for (const [field, value] of Object.entries(changedFields)) {
        console.log('Sending update request:', {
          url: `/categories/category_id/${selectedCategory.category_id}`,
          column: field,
          value,
          field
        });

        try {
          const response = await api.put(`/categories/category_id/${selectedCategory.category_id}`, {
            column: field,
            value: value || "" // Ensure we always send a string value
          });
          console.log('Update response:', response.data);
        } catch (error) {
          console.error(`Failed to update field ${field}:`, error);
          console.error('Request details:', {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            response: error.response?.data
          });
          throw error;
        }
      }

      toast.success("Category updated successfully!", {
        description: `Changes to ${formData.category_name} have been saved`
      });
      setShowEditDialog(false);
      resetFormData();
      fetchCategories();
    } catch (error) {
      console.error("Failed to update category:", error);
      console.error("Request details:", {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        response: error.response?.data
      });
      
      let errorMessage = "Failed to update category. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = "Category not found. It may have been deleted.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setFormErrors({ api: errorMessage });
      toast.error(errorMessage, {
        description: "There was an error processing your request"
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Helper function to validate image URLs
  const isValidImageUrl = (url) => {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      // Check if URL is from allowed domains
      const allowedDomains = [
        'formula1.com',
        'motogp.com',
        'motorsport.com',
        'autosport.com',
        'f1.com',
        'circuit',
        'grandprix',
        'racing',
        'motorsport'
      ];
      
      const isAllowedDomain = allowedDomains.some(domain => urlObj.hostname.toLowerCase().includes(domain));
      if (!isAllowedDomain) {
        console.warn(`Image URL from unauthorized domain: ${url}`);
        return false;
      }
      
      // Check if URL is a direct image link
      const isImageUrl = /\.(jpg|jpeg|png|gif)(\?.*)?$/i.test(url);
      if (!isImageUrl) {
        console.warn(`URL is not a direct image link: ${url}`);
        return false;
      }
      
      return true;
    } catch (e) {
      console.warn(`Invalid URL format: ${url}`);
      return false;
    }
  };

  // Handle delete category
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/categories/category_id/${categoryToDelete.category_id}`);
      toast.success("Category deleted successfully!", {
        description: `${categoryToDelete.category_name} has been removed`
      });
      setShowDeleteDialog(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category", {
        description: "There was an error processing your request"
      });
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  // Open edit dialog with category data
  const openEditDialog = (category) => {
    setSelectedCategory(category);
    setFormData({
      venue_id: category.venue_id,
      category_name: category.category_name,
      gpgt_category_name: category.gpgt_category_name,
      package_type: category.package_type,
      ticket_delivery_days: category.ticket_delivery_days,
      video_wall: category.video_wall,
      covered_seat: category.covered_seat,
      numbered_seat: category.numbered_seat,
      category_info: category.category_info,
      ticket_image_1: category.ticket_image_1,
      ticket_image_2: category.ticket_image_2,
    });
    setShowEditDialog(true);
  };

  // Add function to generate category info
  const handleGenerateInfo = async () => {
    if (!formData.venue_id || !formData.category_name || !formData.package_type) {
      toast.error("Please fill in venue, category name, and package type first");
      return;
    }

    setIsGeneratingInfo(true);
    try {
      const venue = allVenues.find(v => v.venue_id === formData.venue_id);
      if (!venue) {
        throw new Error("Venue not found");
      }

      const categoryInfo = await fetchCategoryInfo(
        venue.venue_name,
        formData.category_name,
        formData.package_type
      );

      // Only update category_info and ticket images
      setFormData(prev => ({
        ...prev,
        category_info: categoryInfo.category_info,
        ticket_image_1: categoryInfo.ticket_image_1,
        ticket_image_2: categoryInfo.ticket_image_2
      }));

      toast.success("Category information and images generated successfully!");
    } catch (error) {
      console.error("Failed to generate category info:", error);
      toast.error("Failed to generate category information", {
        description: error.message
      });
    } finally {
      setIsGeneratingInfo(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Loading categories...
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredCategories.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-end gap-2 justify-between">
        <div className="flex gap-4 items-center flex-wrap">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
          <Combobox
            options={[
              { value: "all", label: "All Venues" },
              ...uniqueVenues.map(venue => ({
                value: venue.venue_id,
                label: venue.venue_name
              }))
            ]}
            value={venueFilter}
            onChange={setVenueFilter}
            placeholder="Filter by Venue"
            className="w-[300px]"
          />
          <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {packageTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
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
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="text-xs py-2">Venue</TableHead>
              <TableHead className="text-xs py-2">Category Name</TableHead>
              <TableHead className="text-xs py-2">Package Type</TableHead>
              <TableHead className="text-xs py-2">Delivery Days</TableHead>
              <TableHead className="text-xs py-2">Features</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((category) => (
                <TableRow key={category.category_id} className="hover:bg-muted/50">
                  <TableCell className="text-xs py-1.5">
                    {uniqueVenues.find(v => v.venue_id === category.venue_id)?.venue_name || "Unknown Venue"}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">{category.category_name}</TableCell>
                  <TableCell className="text-xs py-1.5">{category.package_type}</TableCell>
                  <TableCell className="text-xs py-1.5">{category.ticket_delivery_days} days</TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex gap-2">
                      {category.video_wall && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Video Wall
                        </Badge>
                      )}
                      {category.covered_seat && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Covered
                        </Badge>
                      )}
                      {category.numbered_seat && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Numbered
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(category)}
                        disabled={isDeleting}
                        className="h-7 w-7"
                      >
                        {isDeleting &&
                        categoryToDelete?.category_id === category.category_id ? (
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
                  colSpan={6}
                  className="text-center text-muted-foreground text-xs py-1.5"
                >
                  No categories found.
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
          {Math.min(endIndex, filteredCategories.length)} of{" "}
          {filteredCategories.length} categories
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setSelectedCategory(null);
            resetFormData();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4 relative max-h-[calc(90vh-200px)] overflow-y-auto">
            {(isAdding || isEditing || isGeneratingInfo) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {isGeneratingInfo
                      ? "Generating Category Info..."
                      : showEditDialog
                      ? "Updating Category..."
                      : "Adding Category..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your request
                  </p>
                </div>
              </div>
            )}
            <div
              className={
                isAdding || isEditing || isGeneratingInfo
                  ? "opacity-50 pointer-events-none"
                  : "space-y-4"
              }
            >
              {/* Venue Selection */}
              {!showEditDialog && (
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Combobox
                    options={allVenues.map(venue => ({
                      value: venue.venue_id,
                      label: venue.venue_name
                    }))}
                    value={formData.venue_id}
                    onChange={(value) => handleFieldChange("venue_id", value)}
                    placeholder="Select venue"
                  />
                  {formErrors.venue_id && (
                    <p className="text-sm text-destructive">{formErrors.venue_id}</p>
                  )}
                </div>
              )}
              {/* Edit Dialog: Venue (read-only) */}
              {showEditDialog && (
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input
                    value={allVenues.find(v => v.venue_id === formData.venue_id)?.venue_name || ""}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Category Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.category_name}
                    onChange={(e) => handleFieldChange("category_name", e.target.value)}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleGenerateInfo}
                          disabled={!formData.venue_id || !formData.category_name || !formData.package_type || isGeneratingInfo}
                          className="shrink-0"
                        >
                          {isGeneratingInfo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate category information using AI</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {formErrors.category_name && (
                  <p className="text-sm text-destructive">{formErrors.category_name}</p>
                )}
              </div>
            
              <div className="space-y-2">
                <Label>GPGT Category Name</Label>
                <Input
                  value={formData.gpgt_category_name}
                  onChange={(e) => handleFieldChange("gpgt_category_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Package Type</Label>
                <Select
                  value={formData.package_type}
                  onValueChange={(value) => handleFieldChange("package_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Grandstand">Grandstand</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.package_type && (
                  <p className="text-sm text-destructive">{formErrors.package_type}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ticket Delivery Days</Label>
                <Input
                  type="number"
                  value={formData.ticket_delivery_days}
                  onChange={(e) => handleFieldChange("ticket_delivery_days", parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category Info</Label>
                <Textarea
                  value={formData.category_info}
                  onChange={(e) => handleFieldChange("category_info", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ticket Image 1 URL</Label>
                <Input
                  value={formData.ticket_image_1}
                  onChange={(e) => handleFieldChange("ticket_image_1", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Ticket Image 2 URL</Label>
                <Input
                  value={formData.ticket_image_2}
                  onChange={(e) => handleFieldChange("ticket_image_2", e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.video_wall}
                  onCheckedChange={() => handleSwitchChange("video_wall")}
                />
                <Label>Video Wall</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.covered_seat}
                  onCheckedChange={() => handleSwitchChange("covered_seat")}
                />
                <Label>Covered Seat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.numbered_seat}
                  onCheckedChange={() => handleSwitchChange("numbered_seat")}
                />
                <Label>Numbered Seat</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
                setSelectedCategory(null);
                resetFormData();
              }}
              disabled={isAdding || isEditing || isGeneratingInfo}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditDialog ? handleEditCategory : handleAddCategory}
              disabled={isAdding || isEditing || isGeneratingInfo}
              className="min-w-[100px]"
            >
              {isAdding || isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {showEditDialog ? "Updating..." : "Adding..."}
                </>
              ) : showEditDialog ? (
                "Update Category"
              ) : (
                "Add Category"
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
              category "{categoryToDelete?.category_name}".
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
                  Deleting Category...
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
    </div>
  );
} 