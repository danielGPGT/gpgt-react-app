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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Trash2, Pencil, Search, Loader2, ChevronDown, Check, ChevronsUpDown, AlertTriangle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

function HotelsWithRooms() {
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "hotel_name", direction: "asc" });
  const [isAddHotelDialogOpen, setIsAddHotelDialogOpen] = useState(false);
  const [isEditHotelDialogOpen, setIsEditHotelDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [isDeletingHotel, setIsDeletingHotel] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [deletingHotelId, setDeletingHotelId] = useState(null);
  const [showDeleteHotelDialog, setShowDeleteHotelDialog] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isAddingHotel, setIsAddingHotel] = useState(false);
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("all");

  const roomFieldMappings = {
    hotel_id: "Hotel ID",
    room_id: "Room ID",
    hotel_name: "Hotel Name",
    room_category: "Room Category",
    room_type: "Room Type",
    source: "Source",
    room_flexibility: "Room Flexibility",
    max_guests: "Max Guests",
    booked: "Booked",
    used: "Used",
    remaining: "Remaining",
    check_in_date: "Check In Date",
    check_out_date: "Check Out Date",
    nights: "Nights",
    currency_local: "Currency (Local)",
    breakfast_included: "Breakfast Included",
    breakfast_cost_pp: "Breakfast Cost PP",
    core_per_night_price_local: "Core per night price Local",
    final_per_night_price_local: "Final Per Night Price Local",
    price_per_night_gbp: "Price Per Night (GBP)",
    extra_night_price_gbp: "Extra Night Price (GBP)",
    total_room_cost_gbp: "Total Room Cost (GBP)",
    room_margin: "Room Margin",
    extra_night_margin: "Extra Night Margin",
    attrition_group: "Attrition Group"
  };

  const hotelFieldMappings = {
    event_name: "Event Name",
    package_id: "Package ID",
    hotel_id: "Hotel ID",
    hotel_name: "Hotel Name",
    stars: "Stars",
    package_type: "Package Type",
    city_tax_type: "City Tax Type",
    city_tax_value: "City Tax Value",
    city_tax_amount: "City Tax Amount",
    vat_type: "VAT Type",
    vat_amount: "VAT Amount",
    commission: "Commission",
    "resort_fee_(per_night)": "Resort Fee (Per Night)",
    other_rates: "Other Rates",
    latitude: "Latitude",
    longitude: "Longitude",
    hotel_info: "Hotel Info",
    images: "Images",
  };

  // Add this function near the top of the component, after the state declarations
  const getCurrencySymbol = (currency) => {
    const currencyMap = {
      'USD': '$',
      'GBP': '£',
      'EUR': '€',
      'BHD': 'BD', // Bahrain Dinar
      'AED': 'د.إ', // UAE Dirham
      'SAR': '﷼', // Saudi Riyal
      'QAR': '﷼', // Qatari Riyal
      'KWD': 'د.ك', // Kuwaiti Dinar
      'OMR': 'ر.ع.', // Omani Rial
    };
    return currencyMap[currency] || currency;
  };

  // Add this function to get the currency for a hotel
  const getHotelCurrency = (hotelId) => {
    const hotelRooms = rooms.filter(room => room.hotel_id === hotelId);
    if (hotelRooms.length > 0) {
      return hotelRooms[0]["currency_(local)"] || 'USD';
    }
    return 'USD'; // Default to USD if no rooms found
  };

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, roomsRes] = await Promise.all([
        api.get("copy of hotels"),
        api.get("copy of Stock - rooms"),
      ]);
      console.log('Fetched rooms data:', roomsRes.data);
      setHotels(Array.isArray(hotelsRes.data) ? hotelsRes.data : []);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      setHotels([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Update the uniqueEvents useMemo to use event_name
  const uniqueEvents = useMemo(() => {
    const events = new Set(hotels.map(hotel => hotel.event_name).filter(Boolean));
    return Array.from(events).sort();
  }, [hotels]);

  // Get rooms for selected hotel
  const hotelRooms = useMemo(() => {
    if (!selectedHotel) return [];
    console.log('Selected hotel:', selectedHotel);
    console.log('All rooms:', rooms);
    const filteredRooms = rooms.filter(room => room.hotel_id === selectedHotel.hotel_id);
    console.log('Filtered rooms for hotel:', filteredRooms);
    return filteredRooms;
  }, [selectedHotel, rooms]);

  // Update the filteredHotels useMemo to use event_name
  const filteredHotels = useMemo(() => {
    let result = hotels;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(hotel => 
        hotel.hotel_name?.toLowerCase().includes(query) ||
        hotel.event_name?.toLowerCase().includes(query) ||
        hotel.package_type?.toLowerCase().includes(query)
      );
    }

    // Apply event filter
    if (selectedEvent !== "all") {
      result = result.filter(hotel => hotel.event_name === selectedEvent);
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === "stars") {
        return sortConfig.direction === "asc" 
          ? (aValue || 0) - (bValue || 0)
          : (bValue || 0) - (aValue || 0);
      }

      const comparison = String(aValue || "").localeCompare(String(bValue || ""));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [hotels, searchQuery, sortConfig, selectedEvent]);

  // Room management functions
  const handleAddRoom = async (roomData) => {
    try {
      console.log('Adding room with data:', roomData);
      
      // Generate a unique room ID
      const roomId = crypto.randomUUID();
      
      // Format room margin as percentage
      const roomMargin = roomData.room_margin ? `${roomData.room_margin}%` : "";
      
      // Create an array of values in the correct order, only including user-input fields
      const newRoom = [
        selectedHotel.hotel_id,                    // Hotel ID
        roomId,                                    // Room ID (generated)
        "",                                         // Hotel Name (empty)
        roomData.room_category,                    // Room Category
        roomData.room_type,                        // Room Type
        roomData.source,                           // Source
        roomData.room_flexibility,                 // Room Flexibility
        roomData.max_guests,                       // Max Guests
        roomData.booked,                           // Booked
        "",                                         // Used (empty)
        "",                                         // Remaining (empty)
        roomData.check_in_date,                    // Check In Date
        roomData.check_out_date,                   // Check Out Date
        "",                                         // Nights (empty)
        roomData["currency_(local)"],              // Currency (Local)
        roomData.breakfast_included,               // Breakfast Included
        roomData.breakfast_cost_pp,                // Breakfast Cost PP
        roomData.core_per_night_price_local,       // Core per night price Local
        "",                                         // Final Per Night Price Local (empty)
        "",                                         // Price Per Night (GBP) (empty)
        "",                                         // Extra Night Price (GBP) (empty)
        "",                                         // Total Room Cost (GBP) (empty)
        roomMargin,                                // Room Margin (as percentage)
        "",                                         // Extra Night Margin (empty)
        ""                                         // Attrition Group (empty)
      ];

      console.log('Sending room data to API:', newRoom);
      await api.post("copy of Stock - rooms", newRoom);
      toast.success("Room added successfully");
      setIsRoomDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to add room:", error);
      console.error("Error details:", error.response?.data);
      toast.error("Failed to add room");
    }
  };

  const handleEditRoom = async (roomData) => {
    try {
      // Create an object with the column mappings
      const columnMappings = {
        hotel_id: "Hotel ID",
        room_category: "Room Category",
        room_type: "Room Type",
        source: "Source",
        room_flexibility: "Room Flexibility",
        max_guests: "Max Guests",
        booked: "Booked",
        check_in_date: "Check In Date",
        check_out_date: "Check Out Date",
        "currency_(local)": "Currency (Local)",
        breakfast_included: "Breakfast Included",
        breakfast_cost_pp: "Breakfast Cost PP",
        core_per_night_price_local: "Core per night price Local",
        room_margin: "Room Margin"
      };

      // Get the field and value from the form data
      const { field, value } = roomData;
      
      // Skip if no field is specified
      if (!field) {
        throw new Error("No field specified for update");
      }

      // Get the column name from the mapping
      const columnName = columnMappings[field];
      if (!columnName) {
        throw new Error(`Invalid field: ${field}`);
      }

      // Format the value if needed
      let formattedValue = value;
      if (field === 'room_margin' && value) {
        formattedValue = `${value}%`;
      }
      if (field === 'breakfast_included') {
        formattedValue = value === 'true'; // Convert string to boolean
      }
      if (field === 'hotel_id') {
        formattedValue = selectedHotel?.hotel_id || "";
      }

      const updateData = {
        column: columnName,
        value: formattedValue
      };

      console.log(`Updating ${columnName} to ${formattedValue}`);
      await api.put(`copy of Stock - rooms/Room ID/${roomData.room_id}`, updateData);

      toast.success("Room updated successfully");
      setIsEditDialogOpen(false);
      setEditingRoom(null);
      fetchData();
    } catch (error) {
      console.error("Failed to update room:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to update room");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      setIsDeletingRoom(true);
      setDeletingRoomId(roomId);
      await api.delete(`copy of Stock - rooms/Room ID/${roomId}`);
      toast.success("Room deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to delete room:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to delete room");
    } finally {
      setIsDeletingRoom(false);
      setDeletingRoomId(null);
    }
  };

  // Add hotel management functions
  const handleAddHotel = async (hotelData) => {
    try {
      setIsAddingHotel(true);
      // Generate a unique hotel ID
      const hotelId = crypto.randomUUID();
      
      // Create an object with all the fields
      const newHotel = {
        hotel_id: hotelId,
        hotel_name: hotelData.hotel_name,
        event_name: hotelData.event_name,
        stars: parseInt(hotelData.stars),
        package_type: hotelData.package_type,
        city_tax_type: hotelData.city_tax_type,
        city_tax_value: hotelData.city_tax_value,
        city_tax_amount: parseFloat(hotelData.city_tax_amount),
        vat_type: hotelData.vat_type,
        vat_amount: parseFloat(hotelData.vat_amount),
        commission: parseFloat(hotelData.commission),
        "resort_fee_(per_night)": parseFloat(hotelData.resort_fee),
        other_rates: hotelData.other_rates || "",
        latitude: hotelData.latitude || "",
        longitude: hotelData.longitude || "",
        hotel_info: hotelData.hotel_info || "",
        images: hotelData.images || "[]"
      };

      // Convert to array format using the mappings
      const hotelArray = Object.keys(hotelFieldMappings).map(key => newHotel[key]);

      await api.post("copy of hotels", hotelArray);
      toast.success("Hotel added successfully");
      setIsAddHotelDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to add hotel:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to add hotel");
    } finally {
      setIsAddingHotel(false);
    }
  };

  const handleEditHotel = async (hotelData) => {
    try {
      setIsEditingHotel(true);
      console.log("Starting hotel edit process...");

      const columnMap = {
        hotel_name: "Hotel Name",
        stars: "Stars",
        package_type: "Package Type",
        event_name: "Event Name",
        hotel_info: "Hotel Info",
        longitude: "Longitude",
        latitude: "Latitude",
        images: "Images",
        city_tax_type: "City Tax Type",
        city_tax_value: "City Tax Value",
        city_tax_amount: "City Tax Amount",
        vat_type: "VAT Type",
        vat_amount: "VAT Amount",
        commission: "Commission",
        resort_fee: "Resort Fee (Per Night)",
        other_rates: "Other Rates"
      };

      const changedFields = {};
      Object.keys(hotelData).forEach((key) => {
        if (key === 'images') {
          if (hotelData[key] !== editingHotel[key]) {
            changedFields[key] = hotelData[key];
          }
        } else if (hotelData[key] !== editingHotel[key]) {
          changedFields[key] = hotelData[key];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        console.log("No changes detected");
        toast.info("No changes were made");
        setIsEditHotelDialogOpen(false);
        setEditingHotel(null);
        return;
      }

      for (const [field, value] of Object.entries(changedFields)) {
        const column = columnMap[field];
        if (!column) {
          console.warn(`No column mapping found for field: ${field}`);
          continue;
        }

        let formattedValue = value;
        if (field === 'stars') {
          formattedValue = parseInt(value);
        } else if (['city_tax_amount', 'vat_amount', 'commission', 'resort_fee'].includes(field)) {
          formattedValue = parseFloat(value);
        }

        console.log(`Updating ${column} to ${formattedValue}`);
        await api.put(`copy of hotels/Hotel ID/${editingHotel.hotel_id}`, {
          column,
          value: formattedValue
        });
      }

      console.log("Hotel updated successfully");
      toast.success("Hotel updated successfully");
      setIsEditHotelDialogOpen(false);
      setEditingHotel(null);
      fetchData();
    } catch (error) {
      console.error("Failed to update hotel:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to update hotel");
    } finally {
      setIsEditingHotel(false);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    try {
      setIsDeletingHotel(true);
      setDeletingHotelId(hotelId);
      await api.delete(`copy of hotels/Hotel ID/${hotelId}`);
      toast.success("Hotel deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to delete hotel:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to delete hotel");
    } finally {
      setIsDeletingHotel(false);
      setDeletingHotelId(null);
    }
  };

  // Add a confirmation dialog for hotel deletion
  const handleDeleteClick = (hotel) => {
    setHotelToDelete(hotel);
    setShowDeleteHotelDialog(true);
  };

  const confirmDeleteHotel = async () => {
    if (hotelToDelete) {
      await handleDeleteHotel(hotelToDelete.hotel_id);
      setShowDeleteHotelDialog(false);
      setHotelToDelete(null);
    }
  };

  // Render stars
  const renderStars = (count) => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-primary text-primary" />
      ));
  };

  // Update the HotelDialog component with improved layout and simplified image handling
  const HotelDialog = ({ isOpen, onOpenChange, mode = "add", hotel = null }) => {
    const [formData, setFormData] = useState(() => {
      if (mode === "edit" && hotel) {
        return { ...hotel };
      }
      return {
        event_name: "",
        hotel_name: "",
        stars: 5,
        package_type: "",
        city_tax_type: "per_room",
        city_tax_value: "percentage",
        city_tax_amount: 0,
        vat_type: "percentage",
        vat_amount: 0,
        commission: 0,
        resort_fee: 0,
        other_rates: "",
        latitude: "",
        longitude: "",
        hotel_info: "",
        images: "[]"
      };
    });

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch events when dialog opens
    useEffect(() => {
      const fetchEvents = async () => {
        try {
          setLoading(true);
          const response = await api.get("event");
          setEvents(response.data);
        } catch (error) {
          console.error("Failed to fetch events:", error);
          toast.error("Failed to load events");
        } finally {
          setLoading(false);
        }
      };

      if (isOpen) {
        fetchEvents();
      }
    }, [isOpen]);

    const handleSubmit = async () => {
      try {
        setIsSubmitting(true);
        if (mode === "edit") {
          await handleEditHotel(formData);
        } else {
          await handleAddHotel(formData);
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{mode === "edit" ? "Edit Hotel" : "Add New Hotel"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="grid gap-4 py-4 relative">
              {(isAddingHotel || isEditingHotel) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {mode === "edit" ? "Updating hotel..." : "Adding hotel..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Currency Note */}
              <div className="rounded-md bg-destructive/5 p-2 text-xs text-destructive flex items-center gap-1.5 border border-destructive/10">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ensure all monetary amounts are entered in the currency specified in the hotel contract
              </div>

              {/* Basic Hotel Information */}
              <div className="space-y-3 bg-card rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Hotel Name</Label>
                      <Input
                        value={formData.hotel_name}
                        onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Event</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-9"
                            disabled={loading}
                          >
                            {formData.event_name
                              ? events.find((event) => event.event === formData.event_name)?.event
                              : "Select event..."}
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search event..." />
                            <CommandEmpty>No event found.</CommandEmpty>
                            <CommandGroup>
                              {events.map((event) => (
                                <CommandItem
                                  key={event.event_id}
                                  value={event.event}
                                  onSelect={(currentValue) => {
                                    setFormData({ ...formData, event_name: currentValue });
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-3.5 w-3.5",
                                      formData.event_name === event.event ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {event.event}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Stars</Label>
                        <Select
                          value={String(formData.stars)}
                          onValueChange={(value) => setFormData({ ...formData, stars: parseInt(value) })}
                        >
                          <SelectTrigger className="h-9">
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
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Package Type</Label>
                        <Select
                          value={formData.package_type}
                          onValueChange={(value) => setFormData({ ...formData, package_type: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select package type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Grandstand">Grandstand</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Hotel Information</Label>
                      <Textarea
                        value={formData.hotel_info}
                        onChange={(e) => setFormData({ ...formData, hotel_info: e.target.value })}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location and Images */}
              <div className="space-y-3 bg-card rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Location & Media</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Latitude</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Longitude</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Image URLs (one per line)</Label>
                    <Textarea
                      value={(() => {
                        try {
                          const images = formData.images ? JSON.parse(formData.images) : [];
                          return Array.isArray(images) ? images.join("\n") : "";
                        } catch (e) {
                          return "";
                        }
                      })()}
                      onChange={(e) => {
                        const urls = e.target.value.split("\n").filter(url => url.trim());
                        setFormData({ ...formData, images: JSON.stringify(urls) });
                      }}
                      placeholder="Enter image URLs, one per line"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-3 bg-card rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* City Tax Section */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">City Tax</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Select
                            value={formData.city_tax_type}
                            onValueChange={(value) => setFormData({ ...formData, city_tax_type: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select tax type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_room">Per Room</SelectItem>
                              <SelectItem value="per_night">Per Night</SelectItem>
                              <SelectItem value="per_person">Per Person</SelectItem>
                              <SelectItem value="per_room_per_night">Per Room Per Night</SelectItem>
                              <SelectItem value="per_person_per_night">Per Person Per Night</SelectItem>
                              <SelectItem value="per_person_per_room">Per Person Per Room</SelectItem>
                              <SelectItem value="per_person_per_room_per_night">Per Person Per Room Per Night</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Value Type</Label>
                          <Select
                            value={formData.city_tax_value}
                            onValueChange={(value) => setFormData({ ...formData, city_tax_value: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select value type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.city_tax_amount}
                          onChange={(e) => setFormData({ ...formData, city_tax_amount: parseFloat(e.target.value) })}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* VAT & Fees Section */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">VAT & Fees</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">VAT Type</Label>
                          <Select
                            value={formData.vat_type}
                            onValueChange={(value) => setFormData({ ...formData, vat_type: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select VAT type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                              <SelectItem value="included">Included</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">VAT Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.vat_amount}
                            onChange={(e) => setFormData({ ...formData, vat_amount: parseFloat(e.target.value) })}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Commission</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.commission}
                            onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Resort Fee (per night)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.resort_fee}
                            onChange={(e) => setFormData({ ...formData, resort_fee: parseFloat(e.target.value) })}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3 bg-card rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Additional Information</h3>
                <div className="space-y-1.5">
                  <Label className="text-xs">Other Rates</Label>
                  <Input
                    value={formData.other_rates}
                    onChange={(e) => setFormData({ ...formData, other_rates: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAddingHotel || isEditingHotel} className="h-9">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isAddingHotel || isEditingHotel} className="h-9">
              {isAddingHotel || isEditingHotel ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Adding..."}
                </>
              ) : (
                mode === "edit" ? "Update Hotel" : "Add Hotel"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Update the RoomDialog component
  const RoomDialog = ({ isOpen, onOpenChange, mode = "add", room = null }) => {
    const [formData, setFormData] = useState(() => {
      if (mode === "edit" && room) {
        return {
          ...room,
          check_in_date: room.check_in_date || "",
          check_out_date: room.check_out_date || "",
          hotel_id: selectedHotel?.hotel_id || room.hotel_id,
          breakfast_included: room.breakfast_included ? "true" : "false",
          room_flexibility: room.room_flexibility || "non_flex"
        };
      }
      return {
        hotel_id: selectedHotel?.hotel_id || "",
        room_category: "",
        room_type: "",
        source: "",
        room_flexibility: "non_flex",
        max_guests: 2,
        booked: 0,
        check_in_date: "",
        check_out_date: "",
        "currency_(local)": "",
        breakfast_included: "false",
        breakfast_cost_pp: 0,
        core_per_night_price_local: 0,
        room_margin: "60"
      };
    });

    const [dateRange, setDateRange] = useState({
      from: formData.check_in_date ? new Date(formData.check_in_date.split("/").reverse().join("-")) : null,
      to: formData.check_out_date ? new Date(formData.check_out_date.split("/").reverse().join("-")) : null,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFieldChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
      try {
        setIsSubmitting(true);
        if (mode === "edit") {
          // For each field that has changed, make an update
          const updates = Object.entries(formData)
            .filter(([field, value]) => value !== room[field])
            .map(([field, value]) => handleEditRoom({
              room_id: room.room_id,
              field,
              value
            }));
          await Promise.all(updates);
        } else {
          await handleAddRoom(formData);
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="grid gap-6 py-4 relative">
              {isSubmitting && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {mode === "edit" ? "Updating room..." : "Adding room..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Currency Note */}
              <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ensure all monetary amounts are entered in the currency specified in the hotel contract
              </div>

              {/* Basic Information */}
              <div className="space-y-2">
                <Label>Hotel</Label>
                <Input
                  value={selectedHotel?.hotel_name || ""}
                  disabled={true}
                  className="bg-muted"
                />
              </div>

              {/* Room Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Category</Label>
                  <Input
                    value={formData.room_category}
                    onChange={(e) => handleFieldChange('room_category', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Input
                    value={formData.room_type}
                    onChange={(e) => handleFieldChange('room_type', e.target.value)}
                  />
                </div>
              </div>

              {/* Source and Flexibility */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input
                    value={formData.source}
                    onChange={(e) => handleFieldChange('source', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Flexibility</Label>
                  <Select
                    value={formData.room_flexibility}
                    onValueChange={(value) => handleFieldChange('room_flexibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select flexibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flex">Flex</SelectItem>
                      <SelectItem value="non_flex">Non-Flex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Guests and Booking */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Guests</Label>
                  <Input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => handleFieldChange('max_guests', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Booked</Label>
                  <Input
                    type="number"
                    value={formData.booked}
                    onChange={(e) => handleFieldChange('booked', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <Label>Check-in/out Dates</Label>
                <DatePickerWithRange
                  date={dateRange}
                  setDate={(range) => {
                    setDateRange(range);
                    if (range?.from) {
                      handleFieldChange('check_in_date', format(range.from, "dd/MM/yyyy"));
                      if (range.to) {
                        handleFieldChange('check_out_date', format(range.to, "dd/MM/yyyy"));
                      }
                    }
                  }}
                />
              </div>

              {/* Currency and Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency (Local)</Label>
                  <Select
                    value={formData["currency_(local)"]}
                    onValueChange={(value) => handleFieldChange('currency_(local)', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="BHD">BHD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="NZD">NZD</SelectItem>
                      <SelectItem value="QAR">QAR</SelectItem>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="MYR">MYR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Core Price per Night (Local)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.core_per_night_price_local}
                    onChange={(e) => handleFieldChange('core_per_night_price_local', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Breakfast Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Breakfast Included</Label>
                  <Select
                    value={formData.breakfast_included}
                    onValueChange={(value) => handleFieldChange('breakfast_included', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select breakfast option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Breakfast Cost per Person</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.breakfast_cost_pp}
                    onChange={(e) => handleFieldChange('breakfast_cost_pp', parseFloat(e.target.value))}
                    disabled={formData.breakfast_included === "true"}
                    className={formData.breakfast_included === "true" ? "bg-muted" : ""}
                  />
                </div>
              </div>

              {/* Room Margin */}
              <div className="space-y-2">
                <Label>Room Margin</Label>
                <Input
                  value={formData.room_margin}
                  onChange={(e) => handleFieldChange('room_margin', e.target.value)}
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Adding..."}
                </>
              ) : (
                mode === "edit" ? "Update Room" : "Add Room"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Hotels & Rooms</h2>
          <p className="text-sm text-muted-foreground">
            Manage hotels and their associated rooms
          </p>
        </div>
        <Button onClick={() => setIsAddHotelDialogOpen(true)} disabled={isAddingHotel}>
          {isAddingHotel ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Hotel
            </>
          )}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hotels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={selectedEvent}
          onValueChange={setSelectedEvent}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {uniqueEvents.map((event) => (
              <SelectItem key={event} value={event}>
                {event}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Sort by {sortConfig.key.replace(/_/g, " ")} {sortConfig.direction === "asc" ? "↑" : "↓"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {["hotel_name", "event_name", "package_type", "stars"].map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setSortConfig({ key, direction: "asc" })}
                className={sortConfig.key === key ? "bg-accent" : ""}
              >
                {key.replace(/_/g, " ")}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSortConfig(prev => ({ ...prev, direction: "desc" }))}
              className={sortConfig.direction === "desc" ? "bg-accent" : ""}
            >
              Descending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortConfig(prev => ({ ...prev, direction: "asc" }))}
              className={sortConfig.direction === "asc" ? "bg-accent" : ""}
            >
              Ascending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hotels Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">Hotel Name</TableHead>
              <TableHead className="w-[150px]">Event</TableHead>
              <TableHead className="w-[100px]">Rating</TableHead>
              <TableHead className="w-[150px]">Package Type</TableHead>
              <TableHead className="w-[150px]">City Tax</TableHead>
              <TableHead className="w-[150px]">VAT</TableHead>
              <TableHead className="w-[150px]">Resort Fee</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHotels.map((hotel) => (
              <TableRow key={hotel.hotel_id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-semibold">{hotel.hotel_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {hotel.event_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                  <span className="text-muted-foreground font-bold flex justify-center items-center gap-1">
                      {hotel.stars}
                      <Star className="h-4 w-4 fill-primary text-primary" />
                    </span>
                    

                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {hotel.package_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {hotel.city_tax_value === 'included' ? (
                        <Badge variant="secondary" className="font-normal">Included</Badge>
                      ) : hotel.city_tax_value === 'percentage' ? (
                        `${hotel.city_tax_amount}%`
                      ) : (
                        `${getCurrencySymbol(getHotelCurrency(hotel.hotel_id))}${hotel.city_tax_amount}`
                      )}
                    </span>
                    {hotel.city_tax_value !== 'included' && (
                      <span className="text-xs text-muted-foreground">
                        {hotel.city_tax_type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {hotel.vat_type === 'included' ? (
                        <Badge variant="secondary" className="font-normal">Included</Badge>
                      ) : hotel.vat_type === 'percentage' ? (
                        `${hotel.vat_amount}%`
                      ) : (
                        `${getCurrencySymbol(getHotelCurrency(hotel.hotel_id))}${hotel.vat_amount}`
                      )}
                    </span>
                    {hotel.vat_type !== 'included' && (
                      <span className="text-xs text-muted-foreground">
                        {hotel.vat_type}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {hotel["resort_fee_(per_night)"] === 0 ? (
                        "None"
                      ) : (
                        <>
                          {getCurrencySymbol(getHotelCurrency(hotel.hotel_id))}{hotel["resort_fee_(per_night)"]}
                          <span className="text-xs text-muted-foreground ml-1">
                            per night
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedHotel(hotel)}
                      className="h-8"
                    >
                      View Rooms
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingHotel(hotel);
                        setIsEditHotelDialogOpen(true);
                      }}
                      disabled={isEditingHotel}
                      className="h-8 w-8"
                    >
                      {isEditingHotel ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(hotel)}
                      disabled={isDeletingHotel && deletingHotelId === hotel.hotel_id}
                      className="h-8 w-8"
                    >
                      {isDeletingHotel && deletingHotelId === hotel.hotel_id ? (
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

      {/* Rooms Dialog */}
      {selectedHotel && (
        <Dialog open={!!selectedHotel} onOpenChange={() => setSelectedHotel(null)}>
          <DialogContent className="max-w-[90vw]">
            <DialogHeader>
              <DialogTitle>
                Rooms for {selectedHotel.hotel_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsRoomDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Booked</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Cost/Night</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotelRooms.map((room) => (
                    <TableRow key={room.room_id}>
                      <TableCell>{room.room_category}</TableCell>
                      <TableCell>{room.room_type}</TableCell>
                      <TableCell>{room.source}</TableCell>
                      <TableCell>{room.check_in_date}</TableCell>
                      <TableCell>{room.check_out_date}</TableCell>
                      <TableCell>{room.booked}</TableCell>
                      <TableCell>{room.used}</TableCell>
                      <TableCell>
                        <Badge
                          variant={room.remaining > 0 ? "default" : "destructive"}
                        >
                          {room.remaining}
                        </Badge>
                      </TableCell>
                      <TableCell>£{room["price_per_night_(gbp)"]}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingRoom(room);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRoom(room.room_id)}
                            disabled={isDeletingRoom && deletingRoomId === room.room_id}
                          >
                            {isDeletingRoom && deletingRoomId === room.room_id ? (
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
          </DialogContent>
        </Dialog>
      )}

      {/* Add Hotel Dialog */}
      <HotelDialog
        isOpen={isAddHotelDialogOpen}
        onOpenChange={setIsAddHotelDialogOpen}
        mode="add"
      />

      {/* Edit Hotel Dialog */}
      <HotelDialog
        isOpen={isEditHotelDialogOpen}
        onOpenChange={setIsEditHotelDialogOpen}
        mode="edit"
        hotel={editingHotel}
      />

      {/* Add/Edit Room Dialog */}
      <RoomDialog
        isOpen={isRoomDialogOpen}
        onOpenChange={setIsRoomDialogOpen}
        mode="add"
      />

      {/* Edit Room Dialog */}
      <RoomDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        room={editingRoom}
      />

      {/* Delete Hotel Confirmation Dialog */}
      <AlertDialog open={showDeleteHotelDialog} onOpenChange={setShowDeleteHotelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the hotel "{hotelToDelete?.hotel_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteHotelDialog(false)}
              disabled={isDeletingHotel}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteHotel}
              disabled={isDeletingHotel}
            >
              {isDeletingHotel ? (
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

export default HotelsWithRooms; 