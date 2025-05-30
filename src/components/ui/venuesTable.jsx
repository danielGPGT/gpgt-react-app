import { useEffect, useState, useMemo } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Search,
  Filter,
  Pencil,
  Loader2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { fetchVenueInfo } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function VenuesTable({
  onVenuesLoaded,
  editingVenue,
  setEditingVenue,
  isEditDialogOpen,
  setIsEditDialogOpen,
  isDeleting,
  setIsDeleting,
  venueToDelete,
  setVenueToDelete,
  showDeleteDialog,
  setShowDeleteDialog,
  onEditVenue,
  isEditing,
  openEditDialog,
  isAddDialogOpen,
  setIsAddDialogOpen,
  newVenue,
  setNewVenue,
}) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
  const [isFetchingEditAI, setIsFetchingEditAI] = useState(false);

  // Sorting options
  const sortColumns = [
    { value: "venue_name", label: "Venue Name" },
    { value: "city", label: "City" },
    { value: "country", label: "Country" },
  ];
  const [sortColumn, setSortColumn] = useState("venue_name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Form state
  const initialVenueState = {
    venue_name: "",
    city: "",
    country: "",
    latitude: "",
    longitude: "",
    venue_info: "",
  };

  // Update form when newVenue changes
  useEffect(() => {
    if (newVenue && (newVenue.latitude || newVenue.longitude)) {
      // Only update if we have coordinates from the map
      setNewVenue((prev) => ({
        ...prev, // Keep existing values including city and country
        latitude: newVenue.latitude,
        longitude: newVenue.longitude,
      }));
    }
  }, [newVenue?.latitude, newVenue?.longitude]); // Only depend on coordinates

  // Add field mappings at the top of the component
  const venueFieldMappings = {
    venue_id: "Venue ID",
    venue_name: "Venue Name",
    city: "City",
    country: "Country",
    latitude: "Latitude",
    longitude: "Longitude",
    venue_info: "Venue Info",
  };

  // Add new state for filters
  const [countryFilter, setCountryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  // Add unique country and city options
  const countryOptions = useMemo(() => {
    const unique = Array.from(new Set(venues.map((v) => v.country)));
    return unique.filter(Boolean).sort();
  }, [venues]);

  const cityOptions = useMemo(() => {
    const unique = Array.from(new Set(venues.map((v) => v.city)));
    return unique.filter(Boolean).sort();
  }, [venues]);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await api.get("/venues");
      setVenues(response.data);
      onVenuesLoaded?.(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch venues");
      toast.error("Failed to fetch venues");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenue = async () => {
    try {
      setIsAdding(true);
      await api.post("/venues", newVenue);
      toast.success("Venue added successfully");
      setIsAddDialogOpen(false);
      setNewVenue(initialVenueState);
      fetchVenues();
    } catch (error) {
      toast.error("Failed to add venue");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditVenue = async () => {
    try {
      setIsEditing(true);

      // Compare with original venue to find changed fields
      const changedFields = {};
      Object.keys(editingVenue).forEach((key) => {
        if (
          editingVenue[key] !==
          venues.find((v) => v.venue_id === editingVenue.venue_id)?.[key]
        ) {
          changedFields[key] = editingVenue[key];
        }
      });

      // Only update if there are changes
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        return;
      }

      // Update each changed field
      for (const [field, value] of Object.entries(changedFields)) {
        await api.put(`/venues/Venue ID/${editingVenue.venue_id}`, {
          column: venueFieldMappings[field],
          value: value,
        });
      }

      toast.success("Venue updated successfully");
      setIsEditDialogOpen(false);
      setEditingVenue(null);
      fetchVenues();
    } catch (error) {
      console.error("Failed to update venue:", error);
      toast.error("Failed to update venue");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteVenue = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/venues/Venue ID/${venueToDelete.venue_id}`);
      toast.success("Venue deleted successfully");
      setShowDeleteDialog(false);
      setVenueToDelete(null);
      fetchVenues();
    } catch (error) {
      console.error("Failed to delete venue:", error);
      toast.error("Failed to delete venue");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (venue) => {
    openEditDialog(venue);
  };

  const handleDeleteClick = (venue) => {
    setVenueToDelete(venue);
    setShowDeleteDialog(true);
  };

  // Update the filteredAndSortedVenues function
  const filteredAndSortedVenues = useMemo(() => {
    let result = [...venues];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (venue) =>
          venue.venue_name.toLowerCase().includes(query) ||
          venue.city.toLowerCase().includes(query) ||
          venue.country.toLowerCase().includes(query)
      );
    }

    // Apply country filter
    if (countryFilter !== "all") {
      result = result.filter((venue) => venue.country === countryFilter);
    }

    // Apply city filter
    if (cityFilter !== "all") {
      result = result.filter((venue) => venue.city === cityFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortColumn]?.toLowerCase() || "";
      const bValue = b[sortColumn]?.toLowerCase() || "";
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    return result;
  }, [
    venues,
    searchQuery,
    countryFilter,
    cityFilter,
    sortColumn,
    sortDirection,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [countryFilter, cityFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedVenues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedVenues.slice(startIndex, endIndex);

  return (
    <div className="w-full space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          <Combobox
            options={[
              { value: "all", label: "All Countries" },
              ...countryOptions.map((country) => ({
                value: country,
                label: country,
              })),
            ]}
            value={countryFilter}
            onChange={setCountryFilter}
            placeholder="Filter by Country"
            className="w-[200px]"
          />
          <Combobox
            options={[
              { value: "all", label: "All Cities" },
              ...cityOptions.map((city) => ({ value: city, label: city })),
            ]}
            value={cityFilter}
            onChange={setCityFilter}
            placeholder="Filter by City"
            className="w-[200px]"
          />
        </div>
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
                    sortColumn === col.value ? "font-semibold text-primary" : ""
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
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Venue
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              <TableHead className="text-xs py-2">Venue Name</TableHead>
              <TableHead className="text-xs py-2">City</TableHead>
              <TableHead className="text-xs py-2">Country</TableHead>
              <TableHead className="text-xs py-2">Coordinates</TableHead>
              <TableHead className="text-xs py-2">Info</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : currentItems.length > 0 ? (
              currentItems.map((venue) => (
                <TableRow key={venue.venue_id}>
                  <TableCell className="text-xs py-1.5">
                    {venue.venue_name}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">{venue.city}</TableCell>
                  <TableCell className="text-xs py-1.5">
                    {venue.country}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {venue.latitude}, {venue.longitude}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    {venue.venue_info ? (
                      <div
                        className="max-w-[200px] truncate"
                        title={venue.venue_info}
                      >
                        {venue.venue_info}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-1.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(venue)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(venue)}
                        disabled={isDeleting}
                        className="h-7 w-7"
                      >
                        {isDeleting &&
                        venueToDelete?.venue_id === venue.venue_id ? (
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
                  No venues found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add Venue Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setNewVenue(initialVenueState);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
            <DialogDescription>
              Fill in the details for the new venue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="venue_name">Venue Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="venue_name"
                      value={newVenue?.venue_name || ""}
                      onChange={(e) =>
                        setNewVenue((prev) => ({
                          ...prev,
                          venue_name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Albert Park Circuit"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (!newVenue?.venue_name) {
                                toast.error("Please enter a venue name first");
                                return;
                              }
                              setIsFetchingAI(true);
                              try {
                                const venueInfo = await fetchVenueInfo(newVenue.venue_name);
                                setNewVenue((prev) => ({
                                  ...prev,
                                  venue_info: venueInfo.venue_info || prev.venue_info,
                                  latitude: venueInfo.latitude || prev.latitude,
                                  longitude: venueInfo.longitude || prev.longitude,
                                  city: venueInfo.city || prev.city,
                                  country: venueInfo.country || prev.country,
                                }));
                                toast.success("Venue information fetched successfully");
                              } catch (error) {
                                console.error("Failed to fetch venue info:", error);
                                toast.error("Failed to fetch venue information");
                              } finally {
                                setIsFetchingAI(false);
                              }
                            }}
                            disabled={!newVenue?.venue_name || isFetchingAI}
                            id="add-venue-search-button"
                            className="
                              bg-gradient-to-br from-purple-500 via-blue-400 to-pink-400
                              shadow-[0_0_24px_4px_rgba(168,85,247,0.4)]
                              flex items-center justify-center
                              transition-all duration-200
                              hover:scale-105 hover:shadow-[0_0_32px_8px_rgba(168,85,247,0.5)]
                              text-white
                              cursor-pointer
                              hover:text-white
                            "
                          >
                            {isFetchingAI ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <Sparkles className="h-6 w-6" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          Generate content with AI
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newVenue?.city || ""}
                      onChange={(e) =>
                        setNewVenue((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder="e.g., Melbourne"
                      readOnly={!!newVenue?.city}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newVenue?.country || ""}
                      onChange={(e) =>
                        setNewVenue((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      placeholder="e.g., Australia"
                      readOnly={!!newVenue?.country}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Location Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={newVenue?.latitude || ""}
                    onChange={(e) =>
                      setNewVenue((prev) => ({
                        ...prev,
                        latitude: e.target.value,
                      }))
                    }
                    placeholder="e.g., -37.8497"
                    readOnly={!!newVenue?.latitude}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={newVenue?.longitude || ""}
                    onChange={(e) =>
                      setNewVenue((prev) => ({
                        ...prev,
                        longitude: e.target.value,
                      }))
                    }
                    placeholder="e.g., 144.968"
                    readOnly={!!newVenue?.longitude}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Additional Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="venue_info">Venue Info</Label>
                <Textarea
                  id="venue_info"
                  value={newVenue?.venue_info || ""}
                  onChange={(e) =>
                    setNewVenue((prev) => ({
                      ...prev,
                      venue_info: e.target.value,
                    }))
                  }
                  placeholder="Enter any additional information about the venue..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewVenue(initialVenueState);
              }}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button onClick={handleAddVenue} disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Venue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Venue Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
            <DialogDescription>Update the venue details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_venue_name">Venue Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit_venue_name"
                      value={editingVenue?.venue_name || ""}
                      onChange={(e) =>
                        setEditingVenue({
                          ...editingVenue,
                          venue_name: e.target.value,
                        })
                      }
                      placeholder="e.g., Albert Park Circuit"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (!editingVenue?.venue_name) {
                                toast.error("Please enter a venue name first");
                                return;
                              }
                              setIsFetchingEditAI(true);
                              try {
                                const venueInfo = await fetchVenueInfo(editingVenue.venue_name);
                                setEditingVenue((prev) => ({
                                  ...prev,
                                  venue_info: venueInfo.venue_info || prev.venue_info,
                                  latitude: venueInfo.latitude || prev.latitude,
                                  longitude: venueInfo.longitude || prev.longitude,
                                  city: venueInfo.city || prev.city,
                                  country: venueInfo.country || prev.country,
                                }));
                                toast.success("Venue information fetched successfully");
                              } catch (error) {
                                console.error("Failed to fetch venue info:", error);
                                toast.error("Failed to fetch venue information");
                              } finally {
                                setIsFetchingEditAI(false);
                              }
                            }}
                            disabled={!editingVenue?.venue_name || isFetchingEditAI}
                            id="edit-venue-search-button"
                            className="
                              bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg transform scale-100 transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300
                              flex items-center justify-center
                              transition-all duration-200
                              hover:scale-105 hover:shadow-[0_0_15px_3px_rgba(32, 216, 195, 0.5)]
                              text-white cursor-pointer
                              hover:text-white
                            "
                          >
                            {isFetchingEditAI ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <Sparkles className="h-6 w-6" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          Generate content with AI
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit_city">City</Label>
                    <Input
                      id="edit_city"
                      value={editingVenue?.city || ""}
                      onChange={(e) =>
                        setEditingVenue({
                          ...editingVenue,
                          city: e.target.value,
                        })
                      }
                      placeholder="e.g., Melbourne"
                      readOnly={!!editingVenue?.city}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit_country">Country</Label>
                    <Input
                      id="edit_country"
                      value={editingVenue?.country || ""}
                      onChange={(e) =>
                        setEditingVenue({
                          ...editingVenue,
                          country: e.target.value,
                        })
                      }
                      placeholder="e.g., Australia"
                      readOnly={!!editingVenue?.country}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Location Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_latitude">Latitude</Label>
                  <Input
                    id="edit_latitude"
                    type="number"
                    step="any"
                    value={editingVenue?.latitude || ""}
                    onChange={(e) =>
                      setEditingVenue({
                        ...editingVenue,
                        latitude: e.target.value,
                      })
                    }
                    placeholder="e.g., -37.8497"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_longitude">Longitude</Label>
                  <Input
                    id="edit_longitude"
                    type="number"
                    step="any"
                    value={editingVenue?.longitude || ""}
                    onChange={(e) =>
                      setEditingVenue({
                        ...editingVenue,
                        longitude: e.target.value,
                      })
                    }
                    placeholder="e.g., 144.968"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Additional Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="edit_venue_info">Venue Info</Label>
                <Textarea
                  id="edit_venue_info"
                  value={editingVenue?.venue_info || ""}
                  onChange={(e) =>
                    setEditingVenue({
                      ...editingVenue,
                      venue_info: e.target.value,
                    })
                  }
                  placeholder="Enter any additional information about the venue..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onEditVenue(editingVenue)}
              disabled={isEditing}
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
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
              venue and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVenue}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </div>
  );
}
