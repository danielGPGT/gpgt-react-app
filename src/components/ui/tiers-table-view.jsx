import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TierDialog } from "./tier-dialog";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from 'uuid';

export function TiersTableView({
  isOpen,
  onOpenChange,
  selectedPackage,
  onSuccess,
}) {
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tierToDelete, setTierToDelete] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [airportTransfers, setAirportTransfers] = useState([]);

  useEffect(() => {
    if (isOpen && selectedPackage) {
      console.log("Fetching tiers for package:", selectedPackage);
      fetchData();
    }
  }, [isOpen, selectedPackage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log("Making API call with package_id:", selectedPackage.package_id);
      
      // First get rooms for this package
      const roomsRes = await api.get("/new rooms", {
        params: { packageId: selectedPackage.package_id }
      });
      
      // Extract unique hotel IDs from rooms
      const uniqueHotelIds = [...new Set(roomsRes.data.map(room => room.hotel_id))];
      
      // Get other data in parallel
      const [tiersRes, hotelsRes, circuitRes, airportRes] = await Promise.all([
        api.get("/package-tiers", {
          params: { package_id: selectedPackage.package_id }
        }),
        api.get("/test hotels", {
          params: { hotelIds: uniqueHotelIds.join(',') }
        }),
        api.get("/circuit-transfers", {
          params: { packageId: selectedPackage.package_id }
        }),
        api.get("/airport-transfers", {
          params: { packageId: selectedPackage.package_id }
        })
      ]);

      console.log("Received tiers data:", tiersRes.data);
      setTiers(tiersRes.data);
      setHotels(hotelsRes.data);
      setRooms(roomsRes.data);
      setCircuitTransfers(circuitRes.data);
      setAirportTransfers(airportRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTiers = useMemo(() => {
    console.log("Filtering tiers. Total tiers:", tiers.length);
    console.log("Selected package ID:", selectedPackage.package_id);
    
    const packageTiers = tiers.filter(tier => {
      console.log("Comparing tier package_id:", tier.package_id, "with selected:", selectedPackage.package_id);
      return tier.package_id === selectedPackage.package_id;
    });
    console.log("Tiers for selected package:", packageTiers);

    const filtered = packageTiers.filter((tier) => {
      const matchesSearch =
        searchQuery === "" ||
        tier.tier_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tier.ticket_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || tier.tier_type === typeFilter;
      const matchesStatus = statusFilter === "all" || tier.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
    console.log("Final filtered tiers:", filtered);
    return filtered;
  }, [tiers, searchQuery, typeFilter, statusFilter, selectedPackage]);

  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (tier) => {
    setSelectedTier(tier);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (tier) => {
    setTierToDelete(tier);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tierToDelete) return;

    try {
      await api.delete(`/package-tiers/tier_id/${tierToDelete.tier_id}`);
      toast.success("Tier deleted successfully");
      fetchData();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete tier:", error);
      toast.error("Failed to delete tier");
    } finally {
      setIsDeleteDialogOpen(false);
      setTierToDelete(null);
    }
  };

  const handleAddTier = async () => {
    try {
      const payload = {
        tier_id: uuidv4(),
        package_id: selectedPackage.package_id,
        package_name: selectedPackage.package_name,
        tier_type: formData.tier_type,
        ticket_id: formData.ticket_id,
        ticket_name: formData.ticket_name,
        hotel_id: formData.hotel_id,
        room_id: formData.room_id,
        circuit_transfer_id: formData.circuit_transfer_id || "",
        airport_transfer_id: formData.airport_transfer_id || "",
        status: formData.status || "sales open"
      };

      await api.post("/package-tiers", payload);
      toast.success("Tier added successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add tier:", error);
      toast.error("Failed to add tier");
    }
  };

  const handleEditTier = async () => {
    if (!selectedTier) return;

    try {
      const changedFields = {};

      // Check for changes in each field
      if (formData.tier_type !== selectedTier.tier_type) {
        changedFields["tier_type"] = formData.tier_type;
      }
      if (formData.ticket_id !== selectedTier.ticket_id) {
        changedFields["ticket_id"] = formData.ticket_id;
      }
      if (formData.ticket_name !== selectedTier.ticket_name) {
        changedFields["ticket_name"] = formData.ticket_name;
      }
      if (formData.hotel_id !== selectedTier.hotel_id) {
        changedFields["hotel_id"] = formData.hotel_id;
      }
      if (formData.room_id !== selectedTier.room_id) {
        changedFields["room_id"] = formData.room_id;
      }
      if (formData.circuit_transfer_id !== selectedTier.circuit_transfer_id) {
        changedFields["circuit_transfer_id"] = formData.circuit_transfer_id || "";
      }
      if (formData.airport_transfer_id !== selectedTier.airport_transfer_id) {
        changedFields["airport_transfer_id"] = formData.airport_transfer_id || "";
      }
      if (formData.status !== selectedTier.status) {
        changedFields["status"] = formData.status;
      }

      // Only update if there are changes
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes were made");
        onOpenChange(false);
        return;
      }

      // Update only changed fields
      for (const [column, value] of Object.entries(changedFields)) {
        await api.put(`/package-tiers/tier_id/${selectedTier.tier_id}`, {
          column,
          value,
        });
      }

      toast.success("Tier updated successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update tier:", error);
      toast.error("Failed to update tier");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Tiers for {selectedPackage.package_name}</DialogTitle>
          <DialogDescription className="text-base">
            Manage tiers for this package. Each tier represents a different level of access or service.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6 mt-4">
          <Input
            placeholder="Search tiers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {selectedPackage?.package_type === "Grandstand" ? (
                <>
                  <SelectItem value="Bronze">Bronze</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sales open">Sales Open</SelectItem>
              <SelectItem value="sales closed">Sales Closed</SelectItem>
              <SelectItem value="coming soon">Coming Soon</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddDialogOpen(true)} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Tier
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-[120px] font-semibold">Type</TableHead>
                <TableHead className="w-[300px] font-semibold">Ticket</TableHead>
                <TableHead className="w-[400px] font-semibold">Hotel & Room</TableHead>
                <TableHead className="w-[350px] font-semibold">Transfers</TableHead>
                <TableHead className="w-[150px] font-semibold">Status</TableHead>
                <TableHead className="w-[150px] text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTiers.length > 0 ? (
                filteredTiers.map((tier) => (
                  <TableRow key={tier.tier_id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{tier.tier_type}</TableCell>
                    <TableCell>
                      <div className="font-medium text-base">{tier.ticket_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-base">
                          {(() => {
                            const hotel = hotels.find(
                              (h) => h.hotel_id === tier.hotel_id
                            );
                            return hotel ? hotel.hotel_name : tier.hotel_id || "N/A";
                          })()}
                        </div>
                        <div className="text-muted-foreground">
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
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(() => {
                          const ct = circuitTransfers.find(
                            (c) =>
                              c.circuit_transfer_id === tier.circuit_transfer_id
                          );
                          return ct
                            ? <div className="text-muted-foreground">Circuit: {ct.transport_type}</div>
                            : tier.circuit_transfer_id || "N/A";
                        })()}
                        {(() => {
                          const at = airportTransfers.find(
                            (a) =>
                              a.airport_transfer_id === tier.airport_transfer_id
                          );
                          return at
                            ? <div className="text-muted-foreground">Airport: {at.transport_type}</div>
                            : tier.airport_transfer_id || "N/A";
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${
                          tier.status === "sales closed"
                            ? "bg-destructive/10 text-destructive"
                            : tier.status === "sales open"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {tier.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(tier)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(tier)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No tiers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Tier Dialog */}
        <TierDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode="add"
          package={selectedPackage}
          onSuccess={() => {
            fetchData();
            onSuccess?.();
          }}
        />

        {/* Edit Tier Dialog */}
        <TierDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          mode="edit"
          tier={selectedTier}
          package={selectedPackage}
          onSuccess={() => {
            fetchData();
            onSuccess?.();
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tier</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this tier? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
} 