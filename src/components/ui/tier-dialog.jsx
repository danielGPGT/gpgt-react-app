import { useEffect, useState } from "react";
import api from "@/lib/api";
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
import { Combobox } from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TierDialog({
  isOpen,
  onOpenChange,
  mode = "add",
  tier = null,
  package: selectedPackage,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    tier_type: "",
    ticket_id: "",
    hotel_id: "",
    room_id: "",
    circuit_transfer_id: "",
    airport_transfer_id: "",
    status: "sales open",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [airportTransfers, setAirportTransfers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [customTierType, setCustomTierType] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && tier) {
        setFormData({
          tier_type: tier.tier_type,
          ticket_id: tier.ticket_id,
          hotel_id: tier.hotel_id,
          room_id: tier.room_id,
          circuit_transfer_id: tier.circuit_transfer_id,
          airport_transfer_id: tier.airport_transfer_id,
          status: tier.status || "sales open",
        });
      } else {
        setFormData({
          tier_type: "",
          ticket_id: "",
          hotel_id: "",
          room_id: "",
          circuit_transfer_id: "",
          airport_transfer_id: "",
          status: "sales open",
        });
      }
      setFormErrors({});
      setCustomTierType("");
    }
  }, [isOpen, mode, tier]);

  // Fetch related data
  useEffect(() => {
    if (isOpen && selectedPackage) {
      fetchData();
    }
  }, [isOpen, selectedPackage]);

  const fetchData = async () => {
    try {
      // First get rooms for this package
      const roomsRes = await api.get("/new rooms", {
        params: { packageId: selectedPackage.package_id }
      });
      
      // Extract unique hotel IDs from rooms
      const uniqueHotelIds = [...new Set(roomsRes.data.map(room => room.hotel_id))];
      
      // Get other data in parallel
      const [hotelsRes, circuitRes, airportRes, ticketsRes] = await Promise.all([
        api.get("/test hotels", {
          params: { hotelIds: uniqueHotelIds.join(',') }
        }),
        api.get("/circuit-transfers", {
          params: { packageId: selectedPackage.package_id }
        }),
        api.get("/airport-transfers", {
          params: { packageId: selectedPackage.package_id }
        }),
        api.get("/new tickets", {
          params: { packageId: selectedPackage.package_id }
        })
      ]);

      console.log("Hotels for package:", hotelsRes.data);
      setHotels(hotelsRes.data);
      setRooms(roomsRes.data);
      setCircuitTransfers(circuitRes.data);
      setAirportTransfers(airportRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load form data");
    }
  };

  // Compute tier type options based on selected package
  const tierTypeOptions = selectedPackage?.package_type === "Grandstand"
    ? ["Bronze", "Silver", "Gold"]
    : ["Platinum", "Diamond", "VIP"];
  tierTypeOptions.push("Custom…");

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.tier_type) errors.tier_type = "Required";
    if (!formData.ticket_id) errors.ticket_id = "Required";
    if (!formData.hotel_id) errors.hotel_id = "Required";
    if (!formData.room_id) errors.room_id = "Required";
    if (!formData.airport_transfer_id) errors.airport_transfer_id = "Required";
    if (!formData.status) errors.status = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (mode === "add") {
        // Look up ticket_name
        const ticket = tickets.find((t) => t.ticket_id === formData.ticket_id);
        if (!ticket) {
          setFormErrors({ api: "Invalid ticket selection." });
          return;
        }

        const payload = {
          package_name: selectedPackage.package_name,
          tier_type: formData.tier_type,
          ticket_name: ticket.ticket_name,
          ticket_id: "",
          hotel_id: formData.hotel_id,
          room_id: formData.room_id,
          circuit_transfer_id: formData.circuit_transfer_id,
          airport_transfer_id: formData.airport_transfer_id,
          status: formData.status,
        };

        await api.post("/package-tiers", payload);
        toast.success("Tier added successfully");
      } else {
        // Edit mode
        const changedFields = {};
        if (formData.tier_type !== tier.tier_type) {
          changedFields.tier_type = formData.tier_type;
        }
        if (formData.hotel_id !== tier.hotel_id) {
          changedFields.hotel_id = formData.hotel_id;
        }
        if (formData.room_id !== tier.room_id) {
          changedFields.room_id = formData.room_id;
        }
        if (formData.circuit_transfer_id !== tier.circuit_transfer_id) {
          changedFields.circuit_transfer_id = formData.circuit_transfer_id;
        }
        if (formData.airport_transfer_id !== tier.airport_transfer_id) {
          changedFields.airport_transfer_id = formData.airport_transfer_id;
        }
        if (formData.status !== tier.status) {
          changedFields.status = formData.status;
        }

        // For ticket_name, compare by ticket_id and look up name
        if (formData.ticket_id !== tier.ticket_id) {
          const ticket = tickets.find((t) => t.ticket_id === formData.ticket_id);
          changedFields.ticket_name = ticket ? ticket.ticket_name : "";
          changedFields.ticket_id = "";
        }

        // Only update if there are changes
        if (Object.keys(changedFields).length === 0) {
          toast.info("No changes were made");
          onOpenChange(false);
          return;
        }

        // Update only changed fields
        for (const [column, value] of Object.entries(changedFields)) {
          await api.put(`/package-tiers/tier_id/${tier.tier_id}`, {
            column,
            value,
          });
        }
        toast.success("Tier updated successfully");
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save tier:", error);
      setFormErrors({
        api: error.response?.data?.error || "Failed to save tier",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Tier" : "Add New Tier"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the tier details"
              : "Fill in the details for the new tier"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
              disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            )}
            {formErrors.tier_type && (
              <p className="text-sm text-destructive">{formErrors.tier_type}</p>
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
            {tickets.length === 0 && (
              <p className="text-sm text-muted-foreground">No tickets available for this package</p>
            )}
            {formErrors.ticket_id && (
              <p className="text-sm text-destructive">{formErrors.ticket_id}</p>
            )}
          </div>

          {/* Hotel */}
          <div className="space-y-2">
            <Label htmlFor="hotel_id">Hotel</Label>
            <Combobox
              options={[
                { value: "", label: "Select Hotel" },
                ...hotels
                  .filter(hotel => rooms.some(room => 
                    room.hotel_id === hotel.hotel_id && 
                    room.package_id.split(',').map(id => id.trim()).includes(selectedPackage.package_id)
                  ))
                  .map((hotel) => ({
                    value: hotel.hotel_id,
                    label: hotel.hotel_name,
                  })),
              ]}
              value={formData.hotel_id}
              onChange={(value) => {
                handleFieldChange("hotel_id", value);
                // Clear room selection when hotel changes
                handleFieldChange("room_id", "");
              }}
              placeholder="Select hotel"
              className="w-full"
            />
            {rooms.length === 0 && (
              <p className="text-sm text-muted-foreground">No rooms available for this package</p>
            )}
            {hotels.length > 0 && rooms.length > 0 && 
              hotels.filter(hotel => rooms.some(room => 
                room.hotel_id === hotel.hotel_id && 
                room.package_id.split(',').map(id => id.trim()).includes(selectedPackage.package_id)
              )).length === 0 && (
              <p className="text-sm text-muted-foreground">No hotels available with rooms for this package</p>
            )}
            {formErrors.hotel_id && (
              <p className="text-sm text-destructive">{formErrors.hotel_id}</p>
            )}
          </div>

          {/* Room */}
          <div className="space-y-2">
            <Label htmlFor="room_id">Room</Label>
            <Combobox
              options={[
                { value: "", label: "Select Room" },
                ...rooms
                  .filter(room => 
                    room.hotel_id === formData.hotel_id && 
                    room.package_id.split(',').map(id => id.trim()).includes(selectedPackage.package_id)
                  )
                  .map((room) => ({
                    value: room.room_id,
                    label: `${room.room_category} - ${room.room_type}`,
                  })),
              ]}
              value={formData.room_id}
              onChange={(value) => handleFieldChange("room_id", value)}
              placeholder={formData.hotel_id ? "Select room" : "Select a hotel first"}
              className="w-full"
              disabled={!formData.hotel_id}
            />
            {!formData.hotel_id && (
              <p className="text-sm text-muted-foreground">Please select a hotel first</p>
            )}
            {formData.hotel_id && rooms.filter(room => 
              room.hotel_id === formData.hotel_id && 
              room.package_id.split(',').map(id => id.trim()).includes(selectedPackage.package_id)
            ).length === 0 && (
              <p className="text-sm text-muted-foreground">No rooms available for this hotel and package</p>
            )}
            {formErrors.room_id && (
              <p className="text-sm text-destructive">{formErrors.room_id}</p>
            )}
          </div>

          {/* Circuit Transfer */}
          <div className="space-y-2">
            <Label htmlFor="circuit_transfer_id">Circuit Transfer</Label>
            <Combobox
              options={[
                { value: "", label: "Select Circuit Transfer" },
                ...circuitTransfers.map((transfer) => ({
                  value: transfer.circuit_transfer_id,
                  label: transfer.transport_type,
                })),
              ]}
              value={formData.circuit_transfer_id}
              onChange={(value) => handleFieldChange("circuit_transfer_id", value)}
              placeholder="Select circuit transfer"
              className="w-full"
            />
            {circuitTransfers.length === 0 && (
              <p className="text-sm text-muted-foreground">No circuit transfers available for this package</p>
            )}
          </div>

          {/* Airport Transfer */}
          <div className="space-y-2">
            <Label htmlFor="airport_transfer_id">Airport Transfer</Label>
            <Combobox
              options={[
                { value: "", label: "Select Airport Transfer" },
                ...airportTransfers.map((transfer) => ({
                  value: transfer.airport_transfer_id,
                  label: transfer.transport_type,
                })),
              ]}
              value={formData.airport_transfer_id}
              onChange={(value) => handleFieldChange("airport_transfer_id", value)}
              placeholder="Select airport transfer"
              className="w-full"
            />
            {airportTransfers.length === 0 && (
              <p className="text-sm text-muted-foreground">No airport transfers available for this package</p>
            )}
            {formErrors.airport_transfer_id && (
              <p className="text-sm text-destructive">{formErrors.airport_transfer_id}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleFieldChange("status", value)}
              disabled={isSubmitting}
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
            {formErrors.status && (
              <p className="text-sm text-destructive">{formErrors.status}</p>
            )}
          </div>

          {formErrors.api && (
            <div className="text-sm text-destructive text-center">
              {formErrors.api}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "edit" ? "Updating..." : "Adding..."}
              </>
            ) : mode === "edit" ? (
              "Update Tier"
            ) : (
              "Add Tier"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 