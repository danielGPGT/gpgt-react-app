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
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ChevronDown } from "lucide-react";

function TiersTable() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [packageFilter, setPackageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [airportTransfers, setAirportTransfers] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tierToDelete, setTierToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [packageHotels, setPackageHotels] = useState([]);
  const [hotelRooms, setHotelRooms] = useState([]);
  const [hotelCircuitTransfers, setHotelCircuitTransfers] = useState([]);
  const [hotelAirportTransfers, setHotelAirportTransfers] = useState([]);
  const [customTierType, setCustomTierType] = useState("");
  const [sortColumn, setSortColumn] = useState("package_name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Fetch tiers, packages, and related resources
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [
          tiersRes,
          packagesRes,
          hotelsRes,
          roomsRes,
          circuitRes,
          airportRes,
        ] = await Promise.all([
          api.get("/package-tiers"),
          api.get("/packages"),
          api.get("/hotels"),
          api.get("/rooms"),
          api.get("/circuit-transfers"),
          api.get("/airport-transfers"),
        ]);
        setTiers(tiersRes.data);
        setPackages(packagesRes.data);
        setHotels(hotelsRes.data);
        setRooms(roomsRes.data);
        setCircuitTransfers(circuitRes.data);
        setAirportTransfers(airportRes.data);
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Unique package and type options
  const packageOptions = useMemo(() => {
    const unique = Array.from(new Set(tiers.map((t) => t.package_name)));
    return unique.filter(Boolean).sort();
  }, [tiers]);

  const typeOptions = useMemo(() => {
    const unique = Array.from(new Set(tiers.map((t) => t.tier_type)));
    return unique.filter(Boolean).sort();
  }, [tiers]);

  // Filtered and sorted tiers
  const filteredTiers = useMemo(() => {
    let result = tiers.filter((tier) => {
      const packageMatch =
        packageFilter === "all" || tier.package_name === packageFilter;
      const typeMatch = typeFilter === "all" || tier.tier_type === typeFilter;
      return packageMatch && typeMatch;
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
  }, [tiers, packageFilter, typeFilter, sortColumn, sortDirection]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [packageFilter, typeFilter]);

  // Add/Edit form state
  const initialTierState = {
    package_id: "",
    tier_type: "",
    ticket_id: "",
    hotel_id: "",
    room_id: "",
    circuit_transfer_id: "",
    airport_transfer_id: "",
  };
  const [formData, setFormData] = useState(initialTierState);
  const [formErrors, setFormErrors] = useState({});

  // Fetch tickets when package_id changes in the form
  useEffect(() => {
    async function fetchTickets() {
      if (!formData.package_id) {
        setTickets([]);
        return;
      }
      try {
        const res = await api.get(`/tickets`, {
          params: { packageId: formData.package_id },
        });
        setTickets(res.data);
      } catch (err) {
        setTickets([]);
      }
    }
    fetchTickets();
  }, [formData.package_id]);

  // Fetch hotels when package_id changes in the form
  useEffect(() => {
    async function fetchHotels() {
      if (!formData.package_id) {
        setPackageHotels([]);
        return;
      }
      try {
        const res = await api.get(`/hotels`, {
          params: { packageId: formData.package_id },
        });
        setPackageHotels(res.data);
      } catch (err) {
        setPackageHotels([]);
      }
    }
    fetchHotels();
  }, [formData.package_id]);

  // Fetch rooms when hotel_id changes in the form
  useEffect(() => {
    async function fetchRooms() {
      if (!formData.hotel_id) {
        setHotelRooms([]);
        return;
      }
      try {
        const res = await api.get(`/rooms`, {
          params: { hotelId: formData.hotel_id },
        });
        setHotelRooms(res.data);
      } catch (err) {
        setHotelRooms([]);
      }
    }
    fetchRooms();
  }, [formData.hotel_id]);

  // Fetch circuit and airport transfers when hotel_id changes in the form
  useEffect(() => {
    async function fetchTransfers() {
      if (!formData.hotel_id) {
        setHotelCircuitTransfers([]);
        setHotelAirportTransfers([]);
        return;
      }
      try {
        const [circuitRes, airportRes] = await Promise.all([
          api.get(`/circuit-transfers`, {
            params: { hotelId: formData.hotel_id },
          }),
          api.get(`/airport-transfers`, {
            params: { hotelId: formData.hotel_id },
          }),
        ]);
        setHotelCircuitTransfers(circuitRes.data);
        setHotelAirportTransfers(airportRes.data);
      } catch (err) {
        setHotelCircuitTransfers([]);
        setHotelAirportTransfers([]);
      }
    }
    fetchTransfers();
  }, [formData.hotel_id]);

  // Compute tier type options based on selected package
  const selectedPackage = packages.find(
    (p) => p.package_id === formData.package_id
  );
  let tierTypeOptions = [];
  if (selectedPackage) {
    if (selectedPackage.package_type === "Grandstand") {
      tierTypeOptions = ["Bronze", "Silver", "Gold"];
    } else if (selectedPackage.package_type === "VIP") {
      tierTypeOptions = ["Platinum", "Diamond", "VIP"];
    }
  }
  tierTypeOptions.push("Custom…");

  // Add/Edit handlers
  const openAddDialog = () => {
    setFormData(initialTierState);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (tier) => {
    setEditingTier(tier);
    setFormData({
      package_id: tier.package_id,
      tier_type: tier.tier_type,
      ticket_id: tier.ticket_id,
      hotel_id: tier.hotel_id,
      room_id: tier.room_id,
      circuit_transfer_id: tier.circuit_transfer_id,
      airport_transfer_id: tier.airport_transfer_id,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (tier) => {
    setTierToDelete(tier);
    setShowDeleteDialog(true);
  };

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

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Add tier
  const handleAddTier = async () => {
    // Validate all required fields
    const requiredFields = [
      "package_id",
      "tier_type",
      "ticket_id",
      "hotel_id",
      "room_id",
      "airport_transfer_id",
    ];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        setFormErrors({
          api: `Please select a value for ${field.replace(/_/g, " ")}`,
        });
        return;
      }
    }
    // Prevent duplicate tier for the same package and tier_type
    const pkg = packages.find((p) => p.package_id === formData.package_id);
    if (!pkg) {
      setFormErrors({ api: "Invalid package selection." });
      return;
    }
    const duplicate = tiers.some(
      (tier) =>
        tier.package_name === pkg.package_name &&
        tier.tier_type === formData.tier_type
    );
    if (duplicate) {
      setFormErrors({
        api: `A ${formData.tier_type} tier already exists for this package.`,
      });
      return;
    }
    setIsAdding(true);
    try {
      // Look up ticket_name
      const ticket = tickets.find((t) => t.ticket_id === formData.ticket_id);
      if (!ticket) {
        setFormErrors({ api: "Invalid ticket selection." });
        setIsAdding(false);
        return;
      }
      // Only send the fields the backend expects (omit package_id, ticket_id, tier_id)
      const payload = {
        package_name: pkg.package_name,
        tier_type: formData.tier_type,
        ticket_name: ticket.ticket_name,
        hotel_id: formData.hotel_id,
        room_id: formData.room_id,
        circuit_transfer_id: formData.circuit_transfer_id,
        airport_transfer_id: formData.airport_transfer_id,
      };
      console.log("Submitting tier payload:", payload);
      await api.post("/package-tiers", payload);
      setSuccessMessage("Tier added successfully!");
      setShowSuccessDialog(true);
      setIsAddDialogOpen(false);
      // Refresh
      const res = await api.get("/package-tiers");
      setTiers(res.data);
    } catch (error) {
      console.error("Error adding tier:", error);
      let apiError = "Failed to add tier";
      if (
        error.response &&
        error.response.data &&
        typeof error.response.data === "string"
      ) {
        apiError = error.response.data;
      }
      setFormErrors({ api: apiError });
    } finally {
      setIsAdding(false);
    }
  };

  // Edit tier
  const handleEditTier = async () => {
    if (!editingTier) return;
    setIsEditing(true);
    try {
      // Only consider allowed fields
      const changedFields = {};
      if (formData.tier_type !== editingTier.tier_type) {
        changedFields.tier_type = formData.tier_type;
      }
      if (formData.hotel_id !== editingTier.hotel_id) {
        changedFields.hotel_id = formData.hotel_id;
      }
      if (formData.room_id !== editingTier.room_id) {
        changedFields.room_id = formData.room_id;
      }
      if (formData.circuit_transfer_id !== editingTier.circuit_transfer_id) {
        changedFields.circuit_transfer_id = formData.circuit_transfer_id;
      }
      if (formData.airport_transfer_id !== editingTier.airport_transfer_id) {
        changedFields.airport_transfer_id = formData.airport_transfer_id;
      }
      // For ticket_name, compare by ticket_id and look up name
      if (formData.ticket_id !== editingTier.ticket_id) {
        const ticket = tickets.find((t) => t.ticket_id === formData.ticket_id);
        changedFields.ticket_name = ticket ? ticket.ticket_name : "";
        changedFields.ticket_id = "";
      }
      // For package_name, only allow change if package_id changed (shouldn't happen in edit, but for completeness)
      if (formData.package_id !== editingTier.package_id) {
        const pkg = packages.find((p) => p.package_id === formData.package_id);
        changedFields.package_name = pkg ? pkg.package_name : "";
        changedFields.package_id = "";
      }
      // Always include tier_id as empty string if any change
      if (Object.keys(changedFields).length > 0) {
        changedFields.tier_id = "";
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
        await api.put(`/package-tiers/tier_id/${editingTier.tier_id}`, {
          column,
          value,
        });
      }
      setSuccessMessage("Tier updated successfully!");
      setShowSuccessDialog(true);
      setIsEditDialogOpen(false);
      // Refresh
      const res = await api.get("/package-tiers");
      setTiers(res.data);
    } catch (error) {
      console.error("Failed to update tier:", error);
      setFormErrors({ api: "Failed to update tier" });
    } finally {
      setIsEditing(false);
    }
  };

  // Delete tier
  const confirmDelete = async () => {
    if (!tierToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/package-tiers/tier_id/${tierToDelete.tier_id}`);
      setSuccessMessage("Tier deleted successfully!");
      setShowSuccessDialog(true);
      setShowDeleteDialog(false);
      // Refresh
      const res = await api.get("/package-tiers");
      setTiers(res.data);
    } catch (error) {
      console.error("Failed to delete tier:", error);
      setFormErrors({ api: "Failed to delete tier" });
    } finally {
      setIsDeleting(false);
      setTierToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground p-8">
        Loading tiers...
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-destructive">{error}</div>;
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredTiers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTiers.slice(startIndex, endIndex);

  // Sorting options
  const sortColumns = [
    { value: "package_name", label: "Package" },
    { value: "tier_type", label: "Tier Type" },
    { value: "ticket_name", label: "Ticket" },
    { value: "hotel_id", label: "Hotel" },
    { value: "room_id", label: "Room" },
    { value: "circuit_transfer_id", label: "Circuit Transfer" },
    { value: "airport_transfer_id", label: "Airport Transfer" },
  ];

  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="flex gap-2 justify-between items-end">
      <div className="flex gap-4 items-center">
        <Combobox
          options={[
            { value: "all", label: "All Packages" },
            ...packageOptions.map((pkg) => ({ value: pkg, label: pkg })),
          ]}
          value={packageFilter}
          onChange={setPackageFilter}
          placeholder="Filter by Package"
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
          <Button
            variant="outline"
            size="sm"
            // onClick={toggleSelectionMode} // Uncomment and implement toggleSelectionMode when adding logic
          >
            Bulk Actions
          </Button>
          </div>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead colSpan={8} className="p-2 align-middle">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 ">
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
                    Add Tier
                  </Button>
                </div>
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Tier Type</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Hotel</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Circuit Transfer</TableHead>
              <TableHead>Airport Transfer</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((tier) => (
                <TableRow key={tier.tier_id}>
                  <TableCell>{tier.package_name}</TableCell>
                  <TableCell>{tier.tier_type}</TableCell>
                  <TableCell>{tier.ticket_name}</TableCell>
                  <TableCell>
                    {(() => {
                      const hotel = hotels.find(
                        (h) => h.hotel_id === tier.hotel_id
                      );
                      return hotel ? hotel.hotel_name : tier.hotel_id || "N/A";
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const room = rooms.find(
                        (r) => r.room_id === tier.room_id
                      );
                      return room
                        ? `${room.room_category || ""}${
                            room.room_category && room.room_type ? " – " : ""
                          }${room.room_type || ""}`.trim()
                        : tier.room_id || "N/A";
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const ct = circuitTransfers.find(
                        (c) =>
                          c.circuit_transfer_id === tier.circuit_transfer_id
                      );
                      return ct
                        ? ct.transport_type
                        : tier.circuit_transfer_id || "N/A";
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const at = airportTransfers.find(
                        (a) =>
                          a.airport_transfer_id === tier.airport_transfer_id
                      );
                      return at
                        ? at.transport_type
                        : tier.airport_transfer_id || "N/A";
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(tier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(tier)}
                        disabled={isDeleting}
                      >
                        {isDeleting &&
                        tierToDelete?.tier_id === tier.tier_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
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
                  className="text-center text-muted-foreground"
                >
                  No tiers found.
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredTiers.length)}{" "}
          of {filteredTiers.length} tiers
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingTier(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Tier" : "Add New Tier"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the tier details"
                : "Fill in the details for the new tier"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 relative">
            {(isAdding || isEditing) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-lg font-medium text-primary">
                    {isEditDialogOpen ? "Updating Tier..." : "Adding Tier..."}
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
              {/* Package Selection (Combobox) */}
              {!isEditDialogOpen && (
                <div className="space-y-2">
                  <Label htmlFor="package_id">Package</Label>
                  <Combobox
                    options={[
                      { value: "", label: "Select Package" },
                      ...packages.map((pkg) => ({
                        value: pkg.package_id,
                        label: pkg.package_name,
                      })),
                    ]}
                    value={formData.package_id}
                    onChange={(value) => handleFieldChange("package_id", value)}
                    placeholder="Select package"
                    className="w-full"
                  />
                  {formErrors.package_id && (
                    <p className="text-sm text-red-500">
                      {formErrors.package_id}
                    </p>
                  )}
                </div>
              )}
              {/* Edit Dialog: Package (read-only) */}
              {isEditDialogOpen && (
                <div className="space-y-2">
                  <Label htmlFor="package_name">Package</Label>
                  <Input
                    id="package_name"
                    value={editingTier?.package_name}
                    disabled
                    readOnly
                    className="bg-muted"
                  />
                </div>
              )}
              {/* Tier Type */}
              <div className="space-y-2">
                <Label htmlFor="tier_type">Tier Type</Label>
                <Select
                  value={
                    tierTypeOptions.includes(formData.tier_type)
                      ? formData.tier_type
                      : "Custom…"
                  }
                  onValueChange={(value) => {
                    if (value === "Custom…") {
                      setCustomTierType("");
                      handleFieldChange("tier_type", "Custom…");
                    } else {
                      setCustomTierType("");
                      handleFieldChange("tier_type", value);
                    }
                  }}
                  disabled={isAdding || isEditing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {tierTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(formData.tier_type === "Custom…" ||
                  (!tierTypeOptions.includes(formData.tier_type) &&
                    formData.tier_type !== "")) && (
                  <Input
                    id="custom_tier_type"
                    value={customTierType}
                    onChange={(e) => {
                      setCustomTierType(e.target.value);
                      handleFieldChange("tier_type", e.target.value);
                    }}
                    placeholder="Enter custom tier type"
                    className="mt-2"
                    disabled={isAdding || isEditing}
                  />
                )}
              </div>
              {/* Ticket */}
              <div className="space-y-2">
                <Label htmlFor="ticket_id">Ticket</Label>
                <Combobox
                  options={[
                    { value: "", label: "Select Ticket" },
                    ...tickets.map((ticket) => ({
                      value: ticket.ticket_id,
                      label: ticket.ticket_name,
                    })),
                  ]}
                  value={formData.ticket_id}
                  onChange={(value) => handleFieldChange("ticket_id", value)}
                  placeholder="Select ticket"
                  className="w-full"
                />
              </div>
              {/* Hotel */}
              <div className="space-y-2">
                <Label htmlFor="hotel_id">Hotel</Label>
                <Combobox
                  options={[
                    { value: "", label: "Select Hotel" },
                    ...packageHotels.map((hotel) => ({
                      value: hotel.hotel_id,
                      label: hotel.hotel_name,
                    })),
                  ]}
                  value={formData.hotel_id}
                  onChange={(value) => handleFieldChange("hotel_id", value)}
                  placeholder="Select hotel"
                  className="w-full"
                />
              </div>
              {/* Room */}
              <div className="space-y-2">
                <Label htmlFor="room_id">Room</Label>
                <Combobox
                  options={[
                    { value: "", label: "Select Room" },
                    ...hotelRooms.map((room) => ({
                      value: room.room_id,
                      label: `${room.room_category} – ${room.room_type}`,
                    })),
                  ]}
                  value={formData.room_id}
                  onChange={(value) => handleFieldChange("room_id", value)}
                  placeholder="Select room"
                  className="w-full"
                />
              </div>
              {/* Circuit Transfer */}
              <div className="space-y-2">
                <Label htmlFor="circuit_transfer_id">Circuit Transfer</Label>
                <Combobox
                  options={[
                    { value: "", label: "Select Circuit Transfer" },
                    ...hotelCircuitTransfers.map((ct) => ({
                      value: ct.circuit_transfer_id,
                      label: ct.transport_type,
                    })),
                  ]}
                  value={formData.circuit_transfer_id}
                  onChange={(value) =>
                    handleFieldChange("circuit_transfer_id", value)
                  }
                  placeholder="Select circuit transfer"
                  className="w-full"
                />
              </div>
              {/* Airport Transfer */}
              <div className="space-y-2">
                <Label htmlFor="airport_transfer_id">Airport Transfer</Label>
                <Combobox
                  options={[
                    { value: "", label: "Select Airport Transfer" },
                    ...hotelAirportTransfers.map((at) => ({
                      value: at.airport_transfer_id,
                      label: at.transport_type,
                    })),
                  ]}
                  value={formData.airport_transfer_id}
                  onChange={(value) =>
                    handleFieldChange("airport_transfer_id", value)
                  }
                  placeholder="Select airport transfer"
                  className="w-full"
                />
              </div>
              {formErrors.api && (
                <div className="text-sm text-red-500 text-center">
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
                setEditingTier(null);
              }}
              disabled={isAdding || isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEditTier : handleAddTier}
              disabled={isAdding || isEditing}
              className="min-w-[100px]"
            >
              {isAdding || isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditDialogOpen ? "Updating..." : "Adding..."}
                </>
              ) : isEditDialogOpen ? (
                "Update Tier"
              ) : (
                "Add Tier"
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
              tier.
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
                  Deleting Tier...
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

export { TiersTable };
