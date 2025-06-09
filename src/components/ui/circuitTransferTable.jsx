import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api from "@/lib/api";
import { Pencil, Trash2, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";

// Update the field mapping at the top of the file
const fieldToColumnMapping = {
  event_name: "Event Name",
  package_id: "Package ID",
  package_type: "Package Type",
  hotel_id: "Hotel ID",
  circuit_transfer_id: "Circuit Transfer ID",
  hotel_name: "Hotel Name",
  transport_type: "Transport Type",
  used: "Used",
  coach_capacity: "Coach capacity",
  coaches_required: "Coaches required",
  days: "Days",
  quote_hours: "Quote hours",
  expected_hours: "Expected hours",
  provider_coach: "Provider (coach)",
  cost_per_day_invoice_ccy: "cost per day (invoice ccy)",
  cost_per_extra_hour_per_coach_per_day: "Cost per extra hour (per coach per day)",
  vat_tax_if_not_included_in_price: "VAT/tax (if not included in price)",
  parking_ticket_per_coach_per_day: "Parking ticket (per coach per day)",
  currency: "Currency",
  coach_cost_local: "Coach cost local",
  coach_cost_gbp: "Coach Cost GBP",
  guide_included_in_coach_cost: "Guide included in coach cost",
  guide_cost_per_day: "guide cost per day",
  cost_per_extra_hour_per_guide_per_day: "Cost per extra hour (per guide per day)",
  vat_tax_if_not_included_in_price_guide: "VAT/tax (if not included in guide price)",
  guide_cost_local: "Guide cost local",
  guide_cost_gbp: "Guide Cost (GBP)",
  provider_guides: "Provider (Guides)",
  utilisation_percent: "Utilisation %",
  utilisation_cost_per_seat_local: "Utilisation cost per seat (Local)",
  utilisation_cost_per_seat_gbp: "Utilisation cost per seat (GBP)",
  selling_for_gbp: "Selling for GBP",
  markup: "markup"
};

function CircuitTransferTable() {
  const [circuitTransfers, setCircuitTransfers] = useState([]);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedTransfers, setSelectedTransfers] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filter and sort state
  const [filters, setFilters] = useState({
    search: "",
    event: "all",
    hotel: "all",
    packageType: "all",
    provider: "all",
  });
  const [sortColumn, setSortColumn] = useState("event_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Initialize form data with default values
  const initialFormState = {
    event_name: "",
    package_id: "",
    package_type: "",
    hotel_id: "",
    circuit_transfer_id: "",
    hotel_name: "",
    transport_type: "Shared Coach (Sat & Sun)",
    used: "",
    coach_capacity: 0,
    days: 1,
    quote_hours: 8,
    expected_hours: 12,
    provider_coach: "TBC",
    cost_per_day_invoice_ccy: 0,
    vat_tax_if_not_included_in_price: "0%",
    parking_ticket_per_coach_per_day: 0,
    currency: "USD",
    guide_included_in_coach_cost: "No",
    guide_cost_per_day: 0,
    vat_tax_if_not_included_in_price_guide: "0%",
    guide_cost_local: "",
    guide_cost_gbp: "",
    provider_guides: "TBC",
    utilisation_percent: "70%",
    markup: "60%"
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // Fetch circuit transfers
      const { data: transfersData } = await api.get('/Stock - circuit transfers');
      setCircuitTransfers(transfersData);

      // Fetch events
      const { data: eventsData } = await api.get('/event');
      console.log('Fetched events:', eventsData);
      setEvents(eventsData);

      // Fetch packages
      const { data: packagesData } = await api.get('/packages');
      setPackages(packagesData);

      // Fetch hotels
      const { data: hotelsData } = await api.get('/hotels');
      console.log('Fetched hotels:', hotelsData);
      setHotels(hotelsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error.message || "Failed to fetch data");
      // Set empty arrays as fallback
      setCircuitTransfers([]);
      setEvents([]);
      setPackages([]);
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter hotels when event changes
  useEffect(() => {
    console.log('Event changed:', formData.event_name);
    console.log('Available hotels:', hotels);
    if (formData.event_name) {
      const filtered = hotels.filter(hotel => {
        console.log('Comparing:', {
          hotelEvent: hotel.event_name,
          selectedEvent: formData.event_name,
          matches: hotel.event_name === formData.event_name
        });
        return hotel.event_name === formData.event_name;
      });
      console.log('Filtered hotels:', filtered);
      setFilteredHotels(filtered);
    } else {
      setFilteredHotels([]);
    }
  }, [formData.event_name, hotels]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddTransfer = async (formData) => {
    try {
      setIsAdding(true);
      await api.post('/Stock - circuit transfers', formData);
      await fetchInitialData();
      toast.success("Circuit transfer added successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding transfer:', error);
      toast.error(error.message || "Failed to add circuit transfer");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditTransfer = async (transferId, updatedData) => {
    try {
      setIsEditing(true);
      console.log('handleEditTransfer called with:', { transferId, updatedData });
      
      // Get the circuit_transfer_id from the form data
      const id = typeof transferId === 'object' ? transferId.circuit_transfer_id : transferId;
      console.log('Extracted ID:', id);
      
      if (!id) {
        throw new Error("No transfer ID provided");
      }

      // If updatedData is the transferId (object), use it as the data
      const dataToUpdate = typeof transferId === 'object' ? transferId : updatedData;
      console.log('Data to update:', dataToUpdate);

      if (!dataToUpdate || typeof dataToUpdate !== 'object') {
        throw new Error("No update data provided");
      }

      // Find the original transfer data
      const originalTransfer = circuitTransfers.find(t => t.circuit_transfer_id === id);
      if (!originalTransfer) {
        throw new Error("Original transfer data not found");
      }

      // Compare and only keep changed fields
      const changedFields = Object.entries(dataToUpdate)
        .filter(([key, value]) => {
          // Skip undefined and null values
          if (value === undefined || value === null) return false;

          // Get the original value
          const originalValue = originalTransfer[key];
          
          // Handle numeric values
          if (typeof value === 'number' || !isNaN(Number(value))) {
            const numValue = Number(value);
            const numOriginal = Number(originalValue);
            return numValue !== numOriginal;
          }

          // Handle string values
          if (typeof value === 'string') {
            // Remove any formatting for comparison
            const cleanValue = value.replace(/[^0-9.]/g, '');
            const cleanOriginal = String(originalValue).replace(/[^0-9.]/g, '');
            
            // If both are numeric strings, compare as numbers
            if (!isNaN(Number(cleanValue)) && !isNaN(Number(cleanOriginal))) {
              return Number(cleanValue) !== Number(cleanOriginal);
            }
            
            // Otherwise compare as strings
            return value !== originalValue;
          }

          // For other types, do direct comparison
          return value !== originalValue;
        })
        .reduce((acc, [key, value]) => {
          // Map the form field name to the backend column name
          const backendColumn = fieldToColumnMapping[key];
          if (backendColumn) {
            acc[backendColumn] = value;
          }
          return acc;
        }, {});

      console.log('Changed fields:', changedFields);
      console.log('Original data:', originalTransfer);
      console.log('Updated data:', dataToUpdate);

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        setIsDialogOpen(false);
        return;
      }

      // Get the first (and should be only) changed field
      const [field, value] = Object.entries(changedFields)[0];

      // Format the value based on field type
      let processedValue = value;
      if (typeof value === 'number') {
        processedValue = value.toString();
      } else if (value === '') {
        processedValue = null;
      }

      const requestBody = {
        column: field,
        value: processedValue
      };
      console.log('Request body:', requestBody);

      await api.put(`/Stock - circuit transfers/Circuit Transfer ID/${id}`, requestBody);

      await fetchInitialData();
      toast.success("Circuit transfer updated successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating transfer:', error);
      toast.error(error.message || "Failed to update circuit transfer");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTransfer = async (transferId) => {
    try {
      setIsLoading(true);
      await api.delete(`/Stock - circuit transfers/${transferId}`);
      await fetchInitialData();
      toast.success("Circuit transfer deleted successfully");
    } catch (error) {
      console.error('Error deleting transfer:', error);
      toast.error(error.message || "Failed to delete circuit transfer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellEdit = (transferId, field, value) => {
    setEditingCell({ transferId, field, value });
  };

  const handleCellSave = async (transferId, field) => {
    try {
      const updatedData = { [field]: editingCell.value };
      await handleEditTransfer(transferId, updatedData);
      setEditingCell(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const CircuitTransferForm = ({
    formData: initialFormData,
    setFormData,
    events,
    packages,
    hotels,
    handleSubmit,
    onCancel,
    isLoading = false,
    isEdit = false,
    editingTransfer = null,
    isAdding,
    isEditing
  }) => {
    const [formState, setFormState] = useState(() => {
      // If editing, use the editingTransfer data, otherwise use initialFormData
      const baseData = isEdit && editingTransfer ? {
        // Map backend field names to form field names
        event_name: editingTransfer.event_name || "",
        package_id: editingTransfer.package_id || "",
        package_type: editingTransfer.package_type || "",
        hotel_id: editingTransfer.hotel_id || "",
        circuit_transfer_id: editingTransfer.circuit_transfer_id || crypto.randomUUID(),
        hotel_name: editingTransfer.hotel_name || "",
        transport_type: editingTransfer.transport_type || "Shared Coach (Sat & Sun)",
        used: editingTransfer.used || "",
        coach_capacity: editingTransfer.coach_capacity || 0,
        days: editingTransfer.days || 1,
        quote_hours: editingTransfer.quote_hours || 8,
        expected_hours: editingTransfer.expected_hours || 12,
        provider_coach: editingTransfer["provider_(coach)"] || "TBC",
        cost_per_day_invoice_ccy: editingTransfer["cost_per_day_(invoice_ccy)"] || 0,
        vat_tax_if_not_included_in_price: editingTransfer["vat/tax_(if_not_included_in_price)"] || "0%",
        parking_ticket_per_coach_per_day: editingTransfer["parking_ticket_(per_coach_per_day)"] || 0,
        currency: editingTransfer.currency || "USD",
        guide_included_in_coach_cost: editingTransfer["guide_included_in_coach_cost"] || "No",
        guide_cost_per_day: editingTransfer["guide_cost_per_day"] || 0,
        vat_tax_if_not_included_in_price_guide: editingTransfer["vat/tax_(if_not_included_in_guide_price)"] || "0%",
        provider_guides: editingTransfer["provider_(guides)"] || "TBC",
        utilisation_percent: editingTransfer["utilisation_%"] || "70%",
        markup: editingTransfer.markup || "60%"
      } : initialFormData;

      return {
        ...initialFormState,
        ...baseData
      };
    });
    const [filteredHotels, setFilteredHotels] = useState([]);

    // Update local state when initial data changes
    useEffect(() => {
      if (isEdit && editingTransfer) {
        const updatedState = {
          // Map backend field names to form field names
          event_name: editingTransfer.event_name || "",
          package_id: editingTransfer.package_id || "",
          package_type: editingTransfer.package_type || "",
          hotel_id: editingTransfer.hotel_id || "",
          circuit_transfer_id: editingTransfer.circuit_transfer_id || crypto.randomUUID(),
          hotel_name: editingTransfer.hotel_name || "",
          transport_type: editingTransfer.transport_type || "Shared Coach (Sat & Sun)",
          used: editingTransfer.used || "",
          coach_capacity: editingTransfer.coach_capacity || 0,
          days: editingTransfer.days || 1,
          quote_hours: editingTransfer.quote_hours || 8,
          expected_hours: editingTransfer.expected_hours || 12,
          provider_coach: editingTransfer["provider_(coach)"] || "TBC",
          cost_per_day_invoice_ccy: editingTransfer["cost_per_day_(invoice_ccy)"] || 0,
          vat_tax_if_not_included_in_price: editingTransfer["vat/tax_(if_not_included_in_price)"] || "0%",
          parking_ticket_per_coach_per_day: editingTransfer["parking_ticket_(per_coach_per_day)"] || 0,
          currency: editingTransfer.currency || "USD",
          guide_included_in_coach_cost: editingTransfer["guide_included_in_coach_cost"] || "No",
          guide_cost_per_day: editingTransfer["guide_cost_per_day"] || 0,
          vat_tax_if_not_included_in_price_guide: editingTransfer["vat/tax_(if_not_included_in_guide_price)"] || "0%",
          provider_guides: editingTransfer["provider_(guides)"] || "TBC",
          utilisation_percent: editingTransfer["utilisation_%"] || "70%",
          markup: editingTransfer.markup || "60%"
        };

        // Only update if the data has actually changed
        const hasChanges = Object.keys(updatedState).some(key => 
          updatedState[key] !== formState[key]
        );

        if (hasChanges) {
          setFormState(updatedState);
        }
      }
    }, [isEdit, editingTransfer?.circuit_transfer_id]); // Only depend on the ID

    // Filter hotels when event changes
    useEffect(() => {
      if (formState.event_name) {
        const filtered = hotels.filter(hotel => 
          hotel.event_name === formState.event_name
        );
        setFilteredHotels(filtered);
      } else {
        setFilteredHotels([]);
      }
    }, [formState.event_name, hotels]);

    const handleFieldChange = (field, value) => {
      setFormState(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleFormSubmit = async (e) => {
      e?.preventDefault();
      try {
        console.log('Form state before submit:', formState);
        
        // Pass the form state directly to handleSubmit
        await handleSubmit(formState.circuit_transfer_id, formState);
        onCancel();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(error.response?.data?.error || "Failed to submit form");
      }
    };

    // Auto-set days based on transport type
    useEffect(() => {
      if (formState.transport_type.includes('Sat & Sun')) {
        if (formState.days !== 2) setFormState(prev => ({ ...prev, days: 2 }));
      } else if (formState.transport_type.includes('Fri, Sat & Sun')) {
        if (formState.days !== 3) setFormState(prev => ({ ...prev, days: 3 }));
      }
    }, [formState.transport_type]);

    return (
      <form onSubmit={handleFormSubmit} className="space-y-3">
        {/* Basic Information Section */}
        <div className="space-y-2 pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium">Event Name</label>
              <Select
                value={formState.event_name}
                onValueChange={(value) => handleFieldChange('event_name', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.event_id} value={event.event}>
                      {event.event} ({event.sport})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium">Package Type</label>
              {(() => {
                const selectedEvent = events.find(e => e.event === formState.event_name);
                const isMotoGP = selectedEvent && selectedEvent.sport && selectedEvent.sport.toLowerCase() === 'motogp';
                return (
                  <Select
                    value={formState.package_type}
                    onValueChange={(value) => handleFieldChange('package_type', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select package type" />
                    </SelectTrigger>
                    <SelectContent>
                      {isMotoGP ? (
                        <SelectItem value="Grandstand">Grandstand</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="Both">Both</SelectItem>
                          <SelectItem value="Grandstand">Grandstand</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>

            <div>
              <label className="text-xs font-medium">Hotel</label>
              <Select
                value={formState.hotel_id}
                onValueChange={(value) => handleFieldChange('hotel_id', value)}
                disabled={!formState.event_name}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={formState.event_name ? "Select hotel" : "Select event first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredHotels.map((hotel) => (
                    <SelectItem key={hotel.hotel_id} value={hotel.hotel_id}>
                      {hotel.hotel_name} ({hotel.stars}★)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium">Transport Type</label>
              <Select
                value={formState.transport_type === "custom" ? "custom" : formState.transport_type}
                onValueChange={(value) => {
                  if (value === "custom") {
                    handleFieldChange('transport_type', '');
                  } else {
                    handleFieldChange('transport_type', value);
                  }
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select transport type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shared Coach (Sat & Sun)">Shared Coach (Sat & Sun)</SelectItem>
                  <SelectItem value="Shared Coach (Fri, Sat & Sun)">Shared Coach (Fri, Sat & Sun)</SelectItem>
                  <SelectItem value="Shared MPV (Fri, Sat & Sun)">Shared MPV (Fri, Sat & Sun)</SelectItem>
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {(!formState.transport_type || formState.transport_type === "custom") && (
                <Input
                  type="text"
                  value={formState.transport_type === "custom" ? "" : formState.transport_type}
                  onChange={(e) => handleFieldChange('transport_type', e.target.value)}
                  placeholder="Enter custom transport type"
                  className="h-8 mt-1"
                />
              )}
            </div>
          </div>
        </div>
        <hr className="my-2 border-gray-200" />

        {/* Coach Information Section */}
        <div className="space-y-2 pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Vehicle Information</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium">Vehicle Capacity</label>
              <Input
                type="text"
                value={formState.coach_capacity}
                onChange={(e) => handleFieldChange('coach_capacity', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter coach capacity"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Provider (coach)</label>
              <Input
                value={formState.provider_coach}
                onChange={(e) => handleFieldChange('provider_coach', e.target.value)}
                placeholder="Enter coach provider"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Cost per Day</label>
              <Input
                type="text"
                value={formState.cost_per_day_invoice_ccy}
                onChange={(e) => handleFieldChange('cost_per_day_invoice_ccy', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter cost per day"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">VAT/Tax</label>
              <Input
                value={formState.vat_tax_if_not_included_in_price}
                onChange={(e) => {
                  const value = e.target.value;
                  const formattedValue = value ? (value.endsWith('%') ? value : `${value}%`) : '0%';
                  handleFieldChange('vat_tax_if_not_included_in_price', formattedValue);
                }}
                placeholder="Enter VAT/tax (e.g. 20%)"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Parking Ticket</label>
              <Input
                type="text"
                value={formState.parking_ticket_per_coach_per_day}
                onChange={(e) => handleFieldChange('parking_ticket_per_coach_per_day', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter parking ticket cost"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Currency</label>
              <Select
                value={formState.currency}
                onValueChange={(value) => handleFieldChange('currency', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <hr className="my-2 border-gray-200" />

        {/* Guide Information Section */}
        <div className="space-y-2 pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Guide Information</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium">Guide Included</label>
              <Select
                value={formState.guide_included_in_coach_cost}
                onValueChange={(value) => handleFieldChange('guide_included_in_coach_cost', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium">Guide Cost per Day</label>
              <Input
                type="text"
                value={formState.guide_cost_per_day}
                onChange={(e) => handleFieldChange('guide_cost_per_day', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter guide cost per day"
                disabled={isAdding || isEditing || formState.guide_included_in_coach_cost === 'Yes'}
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Guide VAT/Tax</label>
              <Input
                value={formState.vat_tax_if_not_included_in_price_guide}
                onChange={(e) => {
                  const value = e.target.value;
                  const formattedValue = value ? (value.endsWith('%') ? value : `${value}%`) : '0%';
                  handleFieldChange('vat_tax_if_not_included_in_price_guide', formattedValue);
                }}
                placeholder="Enter VAT/tax (e.g. 20%)"
                disabled={isAdding || isEditing || formState.guide_included_in_coach_cost === 'Yes'}
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Provider (Guides)</label>
              <Input
                value={formState.provider_guides}
                onChange={(e) => handleFieldChange('provider_guides', e.target.value)}
                placeholder="Enter guide provider"
                disabled={isAdding || isEditing || formState.guide_included_in_coach_cost === 'Yes'}
                className="h-8"
              />
            </div>
          </div>
        </div>
        <hr className="my-2 border-gray-200" />

        {/* Schedule and Pricing Section */}
        <div className="space-y-2 pb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Schedule and Pricing</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium">Days</label>
              <Input
                type="text"
                value={formState.days}
                onChange={(e) => handleFieldChange('days', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter number of days"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Quote Hours</label>
              <Input
                type="text"
                value={formState.quote_hours}
                onChange={(e) => handleFieldChange('quote_hours', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter quote hours"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Expected Hours</label>
              <Input
                type="text"
                value={formState.expected_hours}
                onChange={(e) => handleFieldChange('expected_hours', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter expected hours"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Utilisation %</label>
              <Input
                value={formState.utilisation_percent}
                onChange={(e) => handleFieldChange('utilisation_percent', e.target.value)}
                placeholder="Enter utilisation percentage"
                className="h-8"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Markup</label>
              <Input
                value={formState.markup}
                onChange={(e) => handleFieldChange('markup', e.target.value)}
                placeholder="Enter markup"
                className="h-8"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isAdding || isEditing} size="sm">
            Cancel
          </Button>
          <Button type="submit" disabled={isAdding || isEditing} size="sm">
            {isAdding || isEditing ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    );
  };

  // Filtering logic
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
      // Hotel filter
      const hotelMatch =
        filters.hotel === "all" || item.hotel_name === filters.hotel;
      // Package type filter
      const packageTypeMatch =
        filters.packageType === "all" || item.package_type === filters.packageType;
      // Provider filter (coach)
      const providerMatch =
        filters.provider === "all" || item.provider_coach === filters.provider;
      return searchMatch && eventMatch && hotelMatch && packageTypeMatch && providerMatch;
    });
  };

  // Sorting logic
  const filteredTransfers = useMemo(() => {
    let result = filterTransfers(circuitTransfers);
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        // Handle utilisation_percent or utilisation_%
        if (sortColumn === "utilisation_percent" || sortColumn === "utilisation_%") {
          aVal = parseFloat((a.utilisation_percent || a['utilisation_%'] || '0').toString().replace(/[^\d.]/g, '')) || 0;
          bVal = parseFloat((b.utilisation_percent || b['utilisation_%'] || '0').toString().replace(/[^\d.]/g, '')) || 0;
        }
        // Numeric columns
        else if (["coach_capacity", "cost_per_day_invoice_ccy", "guide_cost_per_day", "selling_for_gbp"].includes(sortColumn)) {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else {
          aVal = (aVal || "").toString().toLowerCase();
          bVal = (bVal || "").toString().toLowerCase();
          if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
          if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
          return 0;
        }
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }
    return result;
  }, [circuitTransfers, filters, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredTransfers.slice(startIndex, endIndex);

  // Unique filter options
  const getUnique = (arr, key) => [...new Set(arr.map(item => item[key]).filter(Boolean))];

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransfers(currentItems.map((transfer) => transfer.circuit_transfer_id));
    } else {
      setSelectedTransfers([]);
    }
  };
  const handleSelectTransfer = (transferId, checked) => {
    if (checked) {
      setSelectedTransfers((prev) => [...prev, transferId]);
    } else {
      setSelectedTransfers((prev) => prev.filter((id) => id !== transferId));
    }
  };
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedTransfers([]);
  };
  const handleBulkDelete = async () => {
    if (selectedTransfers.length === 0) return;
    setIsBulkDeleting(true);
    try {
      for (const transferId of selectedTransfers) {
        await handleDeleteTransfer(transferId);
      }
      setSelectedTransfers([]);
    } catch (error) {
      // error already handled in handleDeleteTransfer
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20"></div>
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-lg font-medium text-primary">Loading circuit transfers...</p>
          <p className="text-sm text-muted-foreground">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search circuit transfers..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-8"
          />
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
            {getUnique(circuitTransfers, "event_name").map((event) => (
              <SelectItem key={event} value={event}>{event}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.hotel}
          onValueChange={(value) => setFilters({ ...filters, hotel: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Hotel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hotels</SelectItem>
            {getUnique(circuitTransfers, "hotel_name").map((hotel) => (
              <SelectItem key={hotel} value={hotel}>{hotel}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.packageType}
          onValueChange={(value) => setFilters({ ...filters, packageType: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Package Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Package Types</SelectItem>
            {getUnique(circuitTransfers, "package_type").map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.provider}
          onValueChange={(value) => setFilters({ ...filters, provider: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {getUnique(circuitTransfers, "provider_coach").map((provider) => (
              <SelectItem key={provider} value={provider}>{provider}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table and Add Button */}
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
                <DropdownMenuItem
                  onClick={() => setSortColumn("event_name")}
                  className={sortColumn === "event_name" ? "font-semibold text-primary" : ""}
                >
                  Event {sortColumn === "event_name" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("hotel_name")}
                  className={sortColumn === "hotel_name" ? "font-semibold text-primary" : ""}
                >
                  Hotel {sortColumn === "hotel_name" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("coach_capacity")}
                  className={sortColumn === "coach_capacity" ? "font-semibold text-primary" : ""}
                >
                  Coach Capacity {sortColumn === "coach_capacity" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("utilisation_percent")}
                  className={sortColumn === "utilisation_percent" ? "font-semibold text-primary" : ""}
                >
                  Utilisation % {sortColumn === "utilisation_percent" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("cost_per_day_invoice_ccy")}
                  className={sortColumn === "cost_per_day_invoice_ccy" ? "font-semibold text-primary" : ""}
                >
                  Coach Cost {sortColumn === "cost_per_day_invoice_ccy" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("guide_cost_per_day")}
                  className={sortColumn === "guide_cost_per_day" ? "font-semibold text-primary" : ""}
                >
                  Guide Cost {sortColumn === "guide_cost_per_day" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("selling_for_gbp")}
                  className={sortColumn === "selling_for_gbp" ? "font-semibold text-primary" : ""}
                >
                  Selling For {sortColumn === "selling_for_gbp" && "✓"}
                </DropdownMenuItem>
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
            <span className="text-sm text-muted-foreground">Sorted by <span className="font-medium">{(() => {
              switch (sortColumn) {
                case "event_name": return "Event";
                case "hotel_name": return "Hotel";
                case "coach_capacity": return "Coach Capacity";
                case "utilisation_percent": return "Utilisation %";
                case "cost_per_day_invoice_ccy": return "Coach Cost";
                case "guide_cost_per_day": return "Guide Cost";
                case "selling_for_gbp": return "Selling For";
                default: return sortColumn;
              }
            })()}</span> ({sortDirection === "asc" ? "A-Z" : "Z-A"})</span>
          </div>
          <div className="flex gap-4 items-center">
            {isSelectionMode && selectedTransfers.length > 0 && (
              <Button
                variant="default"
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
                    Delete Selected ({selectedTransfers.length})
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
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setDialogMode("add");
                setSelectedTransfer(null);
                setFormData(initialFormState);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Circuit Transfer
            </Button>
          </div>
        </div>
      


        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              {isSelectionMode && (
                <TableHead className="w-[50px] text-xs py-2">
                  <Checkbox
                    checked={selectedTransfers.length === currentItems.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead className="text-xs py-2">Event</TableHead>
              <TableHead className="text-xs py-2">Package</TableHead>
              <TableHead className="text-xs py-2">Hotel</TableHead>
              <TableHead className="text-xs py-2">Transport Type</TableHead>
              <TableHead className="text-xs py-2">Coach Capacity</TableHead>
              <TableHead className="text-xs py-2">Utilisation %</TableHead>
              <TableHead className="text-xs py-2">Total Cost (Local)</TableHead>
              <TableHead className="text-xs py-2">Total Cost (GBP)</TableHead>
              <TableHead className="text-xs py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((transfer) => (
              <TableRow key={transfer.circuit_transfer_id} className="hover:bg-muted/50">
                {isSelectionMode && (
                  <TableCell className="text-xs py-1.5">
                    <Checkbox
                      checked={selectedTransfers.includes(transfer.circuit_transfer_id)}
                      onCheckedChange={(checked) => handleSelectTransfer(transfer.circuit_transfer_id, checked)}
                      aria-label={`Select ${transfer.event_name}`}
                      className="h-4 w-4"
                    />
                  </TableCell>
                )}
                <TableCell className="text-xs py-1.5 font-medium">{transfer.event_name}</TableCell>
                <TableCell className="text-xs py-1.5">{transfer.package_type}</TableCell>
                <TableCell className="text-xs py-1.5">{transfer.hotel_name}</TableCell>
                <TableCell className="text-xs py-1.5">{transfer.transport_type}</TableCell>
                <TableCell className="text-xs py-1.5">{transfer.coach_capacity}</TableCell>
                <TableCell className="text-xs py-1.5">{transfer.utilisation_percent || transfer['utilisation_%'] || ''}</TableCell>
                <TableCell className="text-xs py-1.5">{(() => {
                  const coachLocal = parseFloat(transfer["coach_cost_local"]?.toString().replace(/,/g, '')) || 0;
                  const guideLocal = parseFloat(transfer["guide_cost_local"]?.toString().replace(/,/g, '')) || 0;
                  const totalLocal = coachLocal + guideLocal;
                  const currency = (transfer.currency || '').toUpperCase();
                  let symbol = '';
                  if (currency === 'USD') symbol = '$';
                  else if (currency === 'EUR') symbol = '€';
                  else if (currency === 'GBP') symbol = '£';
                  else symbol = currency;
                  return totalLocal ? `${symbol}${totalLocal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
                })()}</TableCell>
                <TableCell className="text-xs py-1.5">{(() => {
                  const coachGBP = parseFloat(transfer["coach_cost_gbp"]?.toString().replace(/,/g, '')) || 0;
                  const guideGBP = parseFloat(transfer["guide_cost_(gbp)"]?.toString().replace(/,/g, '')) || 0;
                  const totalGBP = coachGBP + guideGBP;
                  return totalGBP ? `£${totalGBP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
                })()}</TableCell>
                <TableCell className="text-xs py-1.5">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDialogMode("edit");
                        setSelectedTransfer(transfer);
                        setFormData({
                          ...initialFormState,
                          ...transfer
                        });
                        setIsDialogOpen(true);
                      }}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTransfer(transfer.circuit_transfer_id)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredTransfers.length)} of {filteredTransfers.length} circuit transfers
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setFormData(initialFormState);
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Circuit Transfer" : "Edit Circuit Transfer"}
            </DialogTitle>
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
                    {dialogMode === "edit" ? "Updating Transfer..." : "Adding Transfer..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your request
                  </p>
                </div>
              </div>
            )}
            <div className={isAdding || isEditing ? "opacity-50 pointer-events-none" : "space-y-4"}>
              <CircuitTransferForm
                formData={formData}
                setFormData={setFormData}
                events={events}
                packages={packages}
                hotels={hotels}
                handleSubmit={dialogMode === "add" ? handleAddTransfer : handleEditTransfer}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setFormData(initialFormState);
                }}
                isLoading={isLoading}
                isEdit={dialogMode === "edit"}
                editingTransfer={selectedTransfer}
                isAdding={isAdding}
                isEditing={isEditing}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete {selectedTransfers.length} selected circuit transfer(s).
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
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
                setIsSelectionMode(false);
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CircuitTransferTable;
