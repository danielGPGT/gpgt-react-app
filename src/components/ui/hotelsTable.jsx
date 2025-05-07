import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Plus, Trash2, Search, Filter, Pencil } from "lucide-react";
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
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

function HotelsTable() {
  // State declarations
  const [hotels, setHotels] = useState([]);
  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [itemsPerPage] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    stars: "all",
    packageType: "all",
    eventName: "all",
    hotelName: "all",
  });

  // Form state
  const initialHotelState = {
    event_name: "",
    hotel_name: "",
    stars: "5",
    package_type: "",
    hotel_info: "",
    longitude: "",
    latitude: "",
    images: "",
  };

  const [formData, setFormData] = useState(initialHotelState);
  const [errors, setErrors] = useState({});

  // Sorting options
  const sortColumns = [
    { value: "event_name", label: "Event Name" },
    { value: "hotel_name", label: "Hotel Name" },
    { value: "stars", label: "Rating" },
    { value: "package_type", label: "Package Type" },
  ];
  const [sortColumn, setSortColumn] = useState("event_name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Helper functions
  const getUniqueStars = useCallback(() => {
    const uniqueStars = [...new Set(hotels.map((item) => item.stars))];
    return uniqueStars
      .filter((stars) => stars !== undefined && stars !== null)
      .sort((a, b) => a - b);
  }, [hotels]);

  const getUniquePackageTypes = useCallback(() => {
    const uniqueTypes = [...new Set(hotels.map((item) => item.package_type))];
    return uniqueTypes.filter((type) => type);
  }, [hotels]);

  const getUniqueEventNames = useCallback(() => {
    const uniqueEvents = [...new Set(hotels.map((item) => item.event_name))];
    return uniqueEvents.filter((event) => event).sort();
  }, [hotels]);

  const getUniqueHotelNames = useCallback(() => {
    const uniqueHotels = [...new Set(hotels.map((item) => item.hotel_name))];
    return uniqueHotels.filter((hotel) => hotel).sort();
  }, [hotels]);

  // Memoize options
  const starOptions = useMemo(() => [3, 4, 5], []);
  const packageTypeOptions = useMemo(
    () => getUniquePackageTypes(),
    [getUniquePackageTypes]
  );
  const eventOptions = useMemo(() => events, [events]);

  const fetchInitialData = async () => {
    try {
      const [hotelsRes, packagesRes, eventsRes] = await Promise.all([
        api.get("hotels"),
        api.get("packages"),
        api.get("event"),
      ]);

      const validHotels = Array.isArray(hotelsRes.data) ? hotelsRes.data : [];
      const validPackages = Array.isArray(packagesRes.data)
        ? packagesRes.data
        : [];
      const validEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];

      setHotels(validHotels);
      setPackages(validPackages);
      setEvents(validEvents);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      setHotels([]);
      setPackages([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case "hotel_name":
        if (!value || value.trim() === "") {
          newErrors[field] = "Hotel name is required";
        } else {
          delete newErrors[field];
        }
        break;
      case "stars":
        if (!value || isNaN(value) || value < 3 || value > 5) {
          newErrors[field] = "Stars must be between 3 and 5";
        } else {
          delete newErrors[field];
        }
        break;
      case "package_type":
        if (!value || value.trim() === "") {
          newErrors[field] = "Package type is required";
        } else {
          delete newErrors[field];
        }
        break;
      case "event_name":
        if (!value || value.trim() === "") {
          newErrors[field] = "Event is required";
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
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleBlur = (field, value) => {
    validateField(field, value);
  };

  const handleSubmitForm = useCallback(
    async (e, isEdit, editingHotel) => {
      e.preventDefault(); // Prevent form refresh
      try {
        const hotelData = [
          formData.event_name,
          "",
          "",
          formData.hotel_name,
          parseInt(formData.stars),
          formData.package_type,
          formData.hotel_info,
          formData.longitude,
          formData.latitude,
          formData.images,
        ];

        if (isEdit) {
          setIsEditing(true);
          await api.put(`hotels/${editingHotel.hotel_id}`, hotelData);
          setSuccessMessage("Hotel updated successfully!");
        } else {
          setIsAdding(true);
          await api.post("hotels", hotelData);
          setSuccessMessage("Hotel added successfully!");
        }

        setShowSuccessDialog(true);
        setFormData(initialHotelState);
        setErrors({});
        setEditingHotel(null);
        fetchInitialData();
      } catch (error) {
        console.error("Failed to save hotel:", error);
        toast.error("Failed to save hotel");
      } finally {
        setIsAdding(false);
        setIsEditing(false);
      }
    },
    [formData, fetchInitialData]
  );

  const handleAddHotel = async (formData) => {
    try {
      setIsAdding(true);
      const hotelData = [
        formData.event_name,
        "",
        "",
        formData.hotel_name,
        parseInt(formData.stars),
        formData.package_type,
        formData.hotel_info,
        formData.longitude,
        formData.latitude,
        formData.images,
      ];

      await api.post("hotels", hotelData);
      toast.success("Hotel added successfully!");
      fetchInitialData();
    } catch (error) {
      console.error("Failed to add hotel:", error);
      toast.error("Failed to add hotel");
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditHotel = async (formData) => {
    try {
      setIsEditing(true);
      console.log("Starting hotel edit process...");

      // Map of form field names to Google Sheet column names
      const columnMap = {
        hotel_name: "Hotel Name",
        stars: "Stars",
        package_type: "Package Type",
        event_name: "Event Name",
        hotel_info: "Hotel Info",
        longitude: "Longitude",
        latitude: "Latitude",
        images: "Images",
      };

      // Compare with the original hotel data to find changed fields
      const changedFields = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== editingHotel[key]) {
          changedFields[key] = formData[key];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        console.log("No changes detected");
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        setEditingHotel(null);
        return;
      }

      // Update each changed field individually
      for (const [field, value] of Object.entries(changedFields)) {
        const column = columnMap[field];
        if (!column) {
          console.warn(`No column mapping found for field: ${field}`);
          continue;
        }

        console.log(`Updating ${column} to ${value}`);
        await api.put(`hotels/Hotel ID/${editingHotel.hotel_id}`, {
          column,
          value,
        });
      }

      console.log("Hotel updated successfully");
      setSuccessMessage("Hotel updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      setEditingHotel(null);
      console.log("Refreshing data...");
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update hotel:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error("Failed to update hotel. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const AddHotelForm = ({
    formData,
    setFormData,
    events,
    packages,
    handleSubmit,
    onCancel,
    isLoading = false,
  }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState("idle");

    const validateField = (field, value) => {
      const newErrors = { ...errors };

      switch (field) {
        case "hotel_name":
          if (!value || value.trim() === "") {
            newErrors[field] = "Hotel name is required";
          } else {
            delete newErrors[field];
          }
          break;
        case "stars":
          if (!value || isNaN(value) || value < 3 || value > 5) {
            newErrors[field] = "Stars must be between 3 and 5";
          } else {
            delete newErrors[field];
          }
          break;
        case "package_type":
          if (!value || value.trim() === "") {
            newErrors[field] = "Package type is required";
          } else {
            delete newErrors[field];
          }
          break;
        case "event_name":
          if (!value || value.trim() === "") {
            newErrors[field] = "Event is required";
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
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    };

    const handleBlur = (field, value) => {
      validateField(field, value);
    };

    const handleFormSubmit = async () => {
      try {
        setIsSubmitting(true);
        setSubmitStatus("submitting");

        await handleSubmit(formData);
        setSubmitStatus("success");
        toast.success("Hotel added successfully!");

        // Reset form after successful submission
        setFormData({ ...initialHotelState });
        setSubmitStatus("idle");
        onCancel();
      } catch (error) {
        console.error("Error submitting form:", error);
        setSubmitStatus("error");
        toast.error("Failed to add hotel");
      } finally {
        setIsSubmitting(false);
      }
    };

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
              <p className="text-lg font-medium text-primary">
                Adding Hotel...
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your request
              </p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div
          className={`${
            isSubmitting || isLoading
              ? "opacity-50 pointer-events-none"
              : "space-y-4"
          }`}
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel_name">Hotel Name</Label>
                <Input
                  id="hotel_name"
                  value={formData.hotel_name}
                  onChange={(e) =>
                    handleFieldChange("hotel_name", e.target.value)
                  }
                  onBlur={(e) => handleBlur("hotel_name", e.target.value)}
                  placeholder="Enter hotel name"
                  disabled={isSubmitting}
                  className={errors.hotel_name ? "border-red-500" : ""}
                />
                {errors.hotel_name && (
                  <p className="text-sm text-red-500">{errors.hotel_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stars">Stars</Label>
                <Select
                  value={formData.stars}
                  onValueChange={(value) => handleFieldChange("stars", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5].map((stars) => (
                      <SelectItem key={stars} value={String(stars)}>
                        {stars} Stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stars && (
                  <p className="text-sm text-red-500">{errors.stars}</p>
                )}
              </div>
            </div>
          </div>

          {/* Package Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_type">Package Type</Label>
                <Select
                  value={formData.package_type}
                  onValueChange={(value) =>
                    handleFieldChange("package_type", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select package type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniquePackageTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.package_type && (
                  <p className="text-sm text-red-500">{errors.package_type}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_name">Event</Label>
                <Select
                  value={formData.event_name}
                  onValueChange={(value) =>
                    handleFieldChange("event_name", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.event_id} value={event.event}>
                        {event.event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.event_name && (
                  <p className="text-sm text-red-500">{errors.event_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) =>
                    handleFieldChange("longitude", e.target.value)
                  }
                  placeholder="Enter longitude"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) =>
                    handleFieldChange("latitude", e.target.value)
                  }
                  placeholder="Enter latitude"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hotel_info">Hotel Information</Label>
              <Textarea
                id="hotel_info"
                value={formData.hotel_info}
                onChange={(e) =>
                  handleFieldChange("hotel_info", e.target.value)
                }
                placeholder="Enter hotel information"
                disabled={isSubmitting}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Image URLs (comma-separated)</Label>
              <Input
                id="images"
                value={formData.images}
                onChange={(e) => handleFieldChange("images", e.target.value)}
                placeholder="Enter image URLs separated by commas"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || submitStatus === "success" || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting || submitStatus === "success" || isLoading}
              className="min-w-[100px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Added!
                </>
              ) : (
                "Add Hotel"
              )}
            </Button>
          </div>

          {/* Status Message */}
          {submitStatus === "error" && (
            <div className="text-sm text-red-500 text-center">
              Failed to add hotel. Please try again.
            </div>
          )}
        </div>
      </div>
    );
  };

  const EditHotelForm = ({
    formData,
    setFormData,
    events,
    packages,
    handleSubmit,
    onCancel,
    isLoading = false,
  }) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState("idle");

    const validateField = (field, value) => {
      const newErrors = { ...errors };

      switch (field) {
        case "hotel_name":
          if (!value || value.trim() === "") {
            newErrors[field] = "Hotel name is required";
          } else {
            delete newErrors[field];
          }
          break;
        case "stars":
          if (!value || isNaN(value) || value < 3 || value > 5) {
            newErrors[field] = "Stars must be between 3 and 5";
          } else {
            delete newErrors[field];
          }
          break;
        case "package_type":
          if (!value || value.trim() === "") {
            newErrors[field] = "Package type is required";
          } else {
            delete newErrors[field];
          }
          break;
        case "event_name":
          if (!value || value.trim() === "") {
            newErrors[field] = "Event is required";
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
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    };

    const handleBlur = (field, value) => {
      validateField(field, value);
    };

    const handleFormSubmit = async () => {
      try {
        setIsSubmitting(true);
        setSubmitStatus("submitting");

        await handleSubmit(formData);
        setSubmitStatus("success");
        toast.success("Hotel updated successfully!");

        setSubmitStatus("idle");
        onCancel();
      } catch (error) {
        console.error("Error updating hotel:", error);
        setSubmitStatus("error");
        toast.error("Failed to update hotel");
      } finally {
        setIsSubmitting(false);
      }
    };

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
              <p className="text-lg font-medium text-primary">
                Updating Hotel...
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your request
              </p>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div
          className={`${
            isSubmitting || isLoading
              ? "opacity-50 pointer-events-none"
              : "space-y-4"
          }`}
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel_name">Hotel Name</Label>
                <Input
                  id="hotel_name"
                  value={formData.hotel_name}
                  onChange={(e) =>
                    handleFieldChange("hotel_name", e.target.value)
                  }
                  onBlur={(e) => handleBlur("hotel_name", e.target.value)}
                  placeholder="Enter hotel name"
                  disabled={isSubmitting}
                  className={errors.hotel_name ? "border-red-500" : ""}
                />
                {errors.hotel_name && (
                  <p className="text-sm text-red-500">{errors.hotel_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stars">Stars</Label>
                <Select
                  value={formData.stars}
                  onValueChange={(value) => handleFieldChange("stars", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5].map((stars) => (
                      <SelectItem key={stars} value={String(stars)}>
                        {stars} Stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stars && (
                  <p className="text-sm text-red-500">{errors.stars}</p>
                )}
              </div>
            </div>
          </div>

          {/* Package Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_type">Package Type</Label>
                <Select
                  value={formData.package_type}
                  onValueChange={(value) =>
                    handleFieldChange("package_type", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select package type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniquePackageTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.package_type && (
                  <p className="text-sm text-red-500">{errors.package_type}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_name">Event</Label>
                <Select
                  value={formData.event_name}
                  onValueChange={(value) =>
                    handleFieldChange("event_name", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.event_id} value={event.event}>
                        {event.event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.event_name && (
                  <p className="text-sm text-red-500">{errors.event_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) =>
                    handleFieldChange("longitude", e.target.value)
                  }
                  placeholder="Enter longitude"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) =>
                    handleFieldChange("latitude", e.target.value)
                  }
                  placeholder="Enter latitude"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hotel_info">Hotel Information</Label>
              <Textarea
                id="hotel_info"
                value={formData.hotel_info}
                onChange={(e) =>
                  handleFieldChange("hotel_info", e.target.value)
                }
                placeholder="Enter hotel information"
                disabled={isSubmitting}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Image URLs (comma-separated)</Label>
              <Input
                id="images"
                value={formData.images}
                onChange={(e) => handleFieldChange("images", e.target.value)}
                placeholder="Enter image URLs separated by commas"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || submitStatus === "success" || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={isSubmitting || submitStatus === "success" || isLoading}
              className="min-w-[100px]"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : submitStatus === "success" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Updated!
                </>
              ) : (
                "Update Hotel"
              )}
            </Button>
          </div>

          {/* Status Message */}
          {submitStatus === "error" && (
            <div className="text-sm text-red-500 text-center">
              Failed to update hotel. Please try again.
            </div>
          )}
        </div>
      </div>
    );
  };

  const HotelDialog = ({
    isOpen,
    onOpenChange,
    mode = "add",
    hotel = null,
    isLoading = false,
  }) => {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit ? "Edit Hotel" : "Add New Hotel";
    const dialogDescription = isEdit
      ? "Update the hotel details"
      : "Fill in the details for the new hotel";

    // Initialize form data with the current hotel data
    const [formData, setFormData] = useState(() => {
      return isEdit ? { ...editingHotel } : { ...initialHotelState };
    });

    // Update form data when editingHotel changes
    useEffect(() => {
      if (isEdit && editingHotel) {
        setFormData({ ...editingHotel });
      }
    }, [isEdit, editingHotel]);

    const handleFormSubmit = async (formData) => {
      if (isEdit) {
        await handleEditHotel(formData);
      } else {
        await handleAddHotel(formData);
      }
    };

    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!isEdit) {
              setFormData({ ...initialHotelState });
            }
            setEditingHotel(null);
          }
          onOpenChange(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          {isEdit ? (
            <EditHotelForm
              formData={formData}
              setFormData={setFormData}
              events={events}
              packages={packages}
              handleSubmit={handleFormSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isEditing}
            />
          ) : (
            <AddHotelForm
              formData={formData}
              setFormData={setFormData}
              events={events}
              packages={packages}
              handleSubmit={handleFormSubmit}
              onCancel={() => onOpenChange(false)}
              isLoading={isAdding}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filtered and sorted hotels
  const filteredHotels = useMemo(() => {
    let result = hotels.filter((item) => {
      const searchMatch =
        filters.search === "" ||
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );
      const starsMatch =
        filters.stars === "all" || item.stars === parseInt(filters.stars);
      const packageTypeMatch =
        filters.packageType === "all" ||
        item.package_type === filters.packageType;
      const eventNameMatch =
        filters.eventName === "all" || item.event_name === filters.eventName;
      const hotelNameMatch =
        filters.hotelName === "all" || item.hotel_name === filters.hotelName;
      return (
        searchMatch &&
        starsMatch &&
        packageTypeMatch &&
        eventNameMatch &&
        hotelNameMatch
      );
    });
    // Sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        // For numbers, sort numerically
        if (["stars"].includes(sortColumn)) {
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
  }, [hotels, filters, sortColumn, sortDirection]);

  // Apply filters and calculate pagination
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHotels.slice(startIndex, endIndex);

  const renderStars = (count) => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ));
  };

  const handleDeleteHotel = async (hotelId) => {
    try {
      setIsDeleting(true);
      await api.delete(`hotels/Hotel ID/${hotelId}`);
      toast.success("Hotel deleted successfully");
      fetchInitialData();
    } catch (error) {
      console.error("Failed to delete hotel:", error);
      toast.error("Failed to delete hotel");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (hotel) => {
    setHotelToDelete(hotel);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (hotelToDelete) {
      await handleDeleteHotel(hotelToDelete.hotel_id);
      setShowDeleteDialog(false);
      setHotelToDelete(null);
    }
  };

  const openEditDialog = (hotel) => {
    const preparedHotel = {
      ...hotel,
      stars: String(hotel.stars), // Convert stars to string
    };
    setEditingHotel(preparedHotel);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground">Loading hotels...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Hotels</h3>
          <p className="text-muted-foreground">
            View and manage hotel information, including ratings and package
            types
          </p>
        </div>

      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hotels..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={filters.hotelName}
          onValueChange={(value) =>
            setFilters({ ...filters, hotelName: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Hotel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hotels</SelectItem>
            {getUniqueHotelNames().map((hotel) => (
              <SelectItem key={hotel} value={hotel}>
                {hotel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.eventName}
          onValueChange={(value) =>
            setFilters({ ...filters, eventName: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {getUniqueEventNames().map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.stars}
          onValueChange={(value) => setFilters({ ...filters, stars: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stars</SelectItem>
            {getUniqueStars().map((stars) => (
              <SelectItem key={stars} value={String(stars)}>
                {stars} Stars
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.packageType}
          onValueChange={(value) =>
            setFilters({ ...filters, packageType: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Package Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {getUniquePackageTypes().map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">{/* Sorting Dropdown */}
          <TableRow className="bg-background">
              <TableHead colSpan={7} className="p-2 align-middle">
                <div className="flex items-center gap-2 justify-between">
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
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Hotel
        </Button>
      </div>
      </TableHead>
      </TableRow>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Hotel Name</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Package Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.hotel_id}>
                <TableCell className="font-medium">{item.event_name}</TableCell>
                <TableCell className="font-medium">{item.hotel_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {renderStars(item.stars)}
                  </div>
                </TableCell>
                <TableCell>{item.package_type}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(item)}
                      disabled={isDeleting}
                    >
                      {isDeleting &&
                      hotelToDelete?.hotel_id === item.hotel_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to{" "}
          {Math.min(endIndex, filteredHotels.length)} of {filteredHotels.length}{" "}
          hotels
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
      </div>

      {/* Add Dialog */}
      <HotelDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
      />

      {/* Edit Dialog */}
      <HotelDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
      />

      {/* Success Dialog */}
      <AlertDialog
        open={showSuccessDialog}
        onOpenChange={async (open) => {
          if (!open) {
            // When dialog closes, fetch the latest hotels
            try {
              const [hotelsRes] = await Promise.all([api.get("hotels")]);
              setHotels(hotelsRes.data);
            } catch (error) {
              console.error("Failed to fetch hotels:", error);
            }
          }
          setShowSuccessDialog(open);
        }}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              hotel "{hotelToDelete?.hotel_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { HotelsTable };
