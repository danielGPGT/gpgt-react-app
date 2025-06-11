import { useEffect, useState, useMemo, useCallback, memo } from "react";
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
  SelectGroup,
  SelectLabel,
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
import { fetchHotelInfo } from "@/lib/api";
import {
  Checkbox,
} from "@/components/ui/checkbox";

function HotelsWithRooms() {
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
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
  const [filters, setFilters] = useState({
    search: "",
    event: "all",
    packageType: "all",
    city: "all"
  });
  const [sortColumn, setSortColumn] = useState("hotel_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

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
    "resort_fee_per_night": "Resort Fee (Per Night)",
    other_rates: "Other Rates",
    latitude: "Latitude",
    longitude: "Longitude",
    hotel_info: "Hotel Info",
    images: "Images",
    currency: "currency"
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

  // Update the getHotelCurrency function to use the hotel's currency
  const getHotelCurrency = (hotelId) => {
    const hotel = hotels.find(h => h.hotel_id === hotelId);
    return hotel?.currency || 'USD'; // Default to USD if no currency found
  };

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, roomsRes] = await Promise.all([
        api.get("hotels"),
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

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    const events = new Set(hotels.map(hotel => hotel.event_name));
    return Array.from(events).filter(Boolean);
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

  // Room management functions
  const handleAddRoom = useCallback(async (roomData) => {
    try {
      // Validate all mandatory fields
      const requiredFields = {
        room_category: "Room Category",
        room_type: "Room Type",
        source: "Source",
        room_flexibility: "Room Flexibility",
        max_guests: "Max Guests",
        booked: "Booked",
        check_in_date: "Check In Date",
        check_out_date: "Check Out Date",
        "currency_(local)": "Currency",
        breakfast_included: "Breakfast Included",
        breakfast_cost_pp: "Breakfast Cost PP",
        core_per_night_price_local: "Core Price per Night",
        room_margin: "Room Margin"
      };

      for (const [field, label] of Object.entries(requiredFields)) {
        if (!roomData[field] && roomData[field] !== 0) {
          toast.error(`${label} is required`);
          return;
        }
      }

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
        roomData.room_category.trim(),             // Room Category
        roomData.room_type.trim(),                 // Room Type
        roomData.source.trim(),                    // Source
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
  }, [selectedHotel]);

  const handleEditRoom = useCallback(async (roomData) => {
    try {
      // Get the field and value from the form data
      const { field, value } = roomData;
      
      // Skip if no field is specified
      if (!field) {
        throw new Error("No field specified for update");
      }

      // Validate only the field being changed
      const requiredFields = {
        room_category: "Room Category",
        room_type: "Room Type",
        source: "Source",
        room_flexibility: "Room Flexibility",
        max_guests: "Max Guests",
        booked: "Booked",
        check_in_date: "Check In Date",
        check_out_date: "Check Out Date",
        "currency_(local)": "Currency",
        breakfast_included: "Breakfast Included",
        breakfast_cost_pp: "Breakfast Cost PP",
        core_per_night_price_local: "Core Price per Night",
        room_margin: "Room Margin"
      };

      // Only validate the field being changed
      if (!value && value !== 0) {
        toast.error(`${requiredFields[field]} is required`);
        return;
      }

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
  }, [selectedHotel]);

  const handleDeleteRoom = useCallback(async (roomId) => {
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
  }, []);

  // Add hotel management functions
  const handleAddHotel = async (hotelData) => {
    try {
      // Validate mandatory fields
      if (!hotelData.hotel_name?.trim()) {
        toast.error("Hotel name is required");
        return;
      }
      if (!hotelData.event_name?.trim()) {
        toast.error("Event is required");
        return;
      }

      setIsAddingHotel(true);
      // Generate a unique hotel ID
      const hotelId = crypto.randomUUID();
      
      // Create an object with all the fields
      const newHotel = {
        hotel_id: hotelId,
        hotel_name: hotelData.hotel_name.trim(),
        event_name: hotelData.event_name.trim(),
        stars: parseInt(hotelData.stars),
        package_type: hotelData.package_type,
        city_tax_type: hotelData.city_tax_type,
        city_tax_value: hotelData.city_tax_value,
        city_tax_amount: parseFloat(hotelData.city_tax_amount),
        vat_type: hotelData.vat_type,
        vat_amount: parseFloat(hotelData.vat_amount),
        commission: parseFloat(hotelData.commission),
        "resort_fee_per_night": parseFloat(hotelData.resort_fee),
        other_rates: hotelData.other_rates || "",
        latitude: hotelData.latitude || "",
        longitude: hotelData.longitude || "",
        hotel_info: hotelData.hotel_info || "",
        images: hotelData.images || "[]",
        currency: hotelData.currency || "USD"
      };

      // Convert to array format using the mappings
      const hotelArray = Object.keys(hotelFieldMappings).map(key => newHotel[key]);

      await api.post("hotels", hotelArray);
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
      // Validate mandatory fields
      if (!hotelData.hotel_name?.trim()) {
        toast.error("Hotel name is required");
        return;
      }
      if (!hotelData.event_name?.trim()) {
        toast.error("Event is required");
        return;
      }

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
        await api.put(`hotels/Hotel ID/${editingHotel.hotel_id}`, {
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
      await api.delete(`hotels/Hotel ID/${hotelId}`);
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
        images: "[]",
        currency: "USD"
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
              <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ensure all monetary amounts are entered in the currency specified in the hotel contract
              </div>

              {/* Basic Hotel Information */}
              <div className="space-y-3 bg-card rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Hotel Name <span className="text-destructive">*</span></Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.hotel_name}
                          onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                          className="flex-1"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            if (!formData.hotel_name) {
                              toast.error("Please enter a hotel name first");
                              return;
                            }
                            try {
                              const hotelInfo = await fetchHotelInfo(formData.hotel_name);
                              setFormData(prev => ({
                                ...prev,
                                hotel_info: hotelInfo.hotel_info || prev.hotel_info,
                                latitude: hotelInfo.latitude || prev.latitude,
                                longitude: hotelInfo.longitude || prev.longitude
                              }));
                              toast.success("Hotel information fetched successfully");
                            } catch (error) {
                              console.error("Failed to fetch hotel info:", error);
                              toast.error("Failed to fetch hotel information");
                            }
                          }}
                          disabled={!formData.hotel_name}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Event <span className="text-destructive">*</span></Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-[250px] justify-between"
                            required
                          >
                            {formData.event_name
                              ? events.find((event) => event.event === formData.event_name)?.event
                              : "Select event..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
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

              {/* Financial Information */}
              <div className="space-y-3 bg-card rounded-lg border p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Financial Information</h3>
                
                {/* Currency Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    required
                  >
                    <SelectTrigger className="h-9">
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
                
                {/* City Tax Section */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium whitespace-nowrap">City Tax</Label>
                    <Select
                      value={formData.city_tax_value}
                      onValueChange={(value) => {
                        setFormData({ 
                          ...formData, 
                          city_tax_value: value,
                          city_tax_amount: value === "included" ? 0 : formData.city_tax_amount
                        });
                      }}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="included">Included</SelectItem>
                      </SelectContent>
                    </Select>

                    {formData.city_tax_value !== "included" && (
                      <>
                        <Select
                          value={formData.city_tax_type}
                          onValueChange={(value) => setFormData({ ...formData, city_tax_type: value })}
                        >
                          <SelectTrigger className="w-[180px] h-8">
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

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.city_tax_amount}
                            onChange={(e) => setFormData({ ...formData, city_tax_amount: parseFloat(e.target.value) })}
                            className="w-[100px] h-8"
                            placeholder={formData.city_tax_value === "percentage" ? "Amount %" : "Amount"}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* VAT Section */}
                <div className="space-y-3 border-b pb-4">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium whitespace-nowrap">VAT</Label>
                    <Select
                      value={formData.vat_type}
                      onValueChange={(value) => {
                        setFormData({ 
                          ...formData, 
                          vat_type: value,
                          vat_amount: value === "included" ? 0 : formData.vat_amount
                        });
                      }}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="included">Included</SelectItem>
                      </SelectContent>
                    </Select>

                    {formData.vat_type !== "included" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.vat_amount}
                          onChange={(e) => setFormData({ ...formData, vat_amount: parseFloat(e.target.value) })}
                          className="w-[100px] h-8"
                          placeholder={formData.vat_type === "percentage" ? "Amount %" : "Amount"}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Fees Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Additional Fees</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Commission (%)</Label>
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

              {/* Location and Media */}
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
                          min="-90"
                          max="90"
                          value={formData.latitude}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= -90 && value <= 90) {
                              setFormData({ ...formData, latitude: Number(value.toFixed(6)) });
                            }
                          }}
                          className="h-9"
                          placeholder="e.g. 51.507222"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Longitude</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          min="-180"
                          max="180"
                          value={formData.longitude}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= -180 && value <= 180) {
                              setFormData({ ...formData, longitude: Number(value.toFixed(6)) });
                            }
                          }}
                          className="h-9"
                          placeholder="e.g. -0.127500"
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
  const RoomDialog = memo(({ isOpen, onOpenChange, mode = "add", room = null }) => {
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

    // Reset form when dialog opens/closes
    useEffect(() => {
      if (isOpen) {
        if (mode === "edit" && room) {
          setFormData({
            ...room,
            check_in_date: room.check_in_date || "",
            check_out_date: room.check_out_date || "",
            hotel_id: selectedHotel?.hotel_id || room.hotel_id,
            breakfast_included: room.breakfast_included ? "true" : "false",
            room_flexibility: room.room_flexibility || "non_flex"
          });
          setDateRange({
            from: room.check_in_date ? new Date(room.check_in_date.split("/").reverse().join("-")) : null,
            to: room.check_out_date ? new Date(room.check_out_date.split("/").reverse().join("-")) : null,
          });
        } else {
          setFormData({
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
          });
          setDateRange({ from: null, to: null });
        }
      }
    }, [isOpen, mode, room, selectedHotel]);

    const handleFieldChange = useCallback((field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback(async () => {
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
    }, [formData, mode, room, handleEditRoom, handleAddRoom]);

    const handleClose = useCallback(() => {
      onOpenChange(false);
    }, [onOpenChange]);

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
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
                  <Label>Room Category <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.room_category}
                    onChange={(e) => handleFieldChange('room_category', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Type <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.room_type}
                    onChange={(e) => handleFieldChange('room_type', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Source and Flexibility */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.source}
                    onChange={(e) => handleFieldChange('source', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Flexibility <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.room_flexibility}
                    onValueChange={(value) => handleFieldChange('room_flexibility', value)}
                    required
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
                  <Label>Max Guests <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => handleFieldChange('max_guests', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Booked <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    value={formData.booked}
                    onChange={(e) => handleFieldChange('booked', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <Label>Check-in/out Dates <span className="text-destructive">*</span></Label>
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
                  required
                />
              </div>

              {/* Currency and Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency (Local) <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData["currency_(local)"]}
                    onValueChange={(value) => handleFieldChange('currency_(local)', value)}
                    required
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
                  <Label>Core Price per Night (Local) <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.core_per_night_price_local}
                    onChange={(e) => handleFieldChange('core_per_night_price_local', parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Breakfast Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Breakfast Included <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.breakfast_included}
                    onValueChange={(value) => handleFieldChange('breakfast_included', value)}
                    required
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
                  <Label>Breakfast Cost per Person <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.breakfast_cost_pp}
                    onChange={(e) => handleFieldChange('breakfast_cost_pp', parseFloat(e.target.value))}
                    disabled={formData.breakfast_included === "true"}
                    className={formData.breakfast_included === "true" ? "bg-muted" : ""}
                    required
                  />
                </div>
              </div>

              {/* Room Margin */}
              <div className="space-y-2">
                <Label>Room Margin <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.room_margin}
                  onChange={(e) => handleFieldChange('room_margin', e.target.value)}
                  required
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
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
  });

  // Add a new component for the rooms table view
  const RoomsTableView = memo(({ isOpen, onOpenChange, onAddRoom }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("category");
    const [sortDirection, setSortDirection] = useState("asc");

    // Reset search and sort when dialog opens/closes
    useEffect(() => {
      if (!isOpen) {
        setSearchTerm("");
        setSortBy("category");
        setSortDirection("asc");
      }
    }, [isOpen]);

    // Memoize filtered and sorted rooms
    const filteredAndSortedRooms = useMemo(() => {
      let result = hotelRooms;

      // Apply search filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        result = result.filter(room => 
          room.room_category?.toLowerCase().includes(query) ||
          room.room_type?.toLowerCase().includes(query) ||
          room.source?.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      result = [...result].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'category':
            comparison = a.room_category.localeCompare(b.room_category);
            break;
          case 'type':
            comparison = a.room_type.localeCompare(b.room_type);
            break;
          case 'remaining':
            comparison = (b.remaining || 0) - (a.remaining || 0);
            break;
          case 'cost':
            comparison = (b["price_per_night_(gbp)"] || 0) - (a["price_per_night_(gbp)"] || 0);
            break;
          default:
            comparison = 0;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });

      return result;
    }, [hotelRooms, searchTerm, sortBy, sortDirection]);

    const handleSort = useCallback((newSortBy) => {
      if (sortBy === newSortBy) {
        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
      } else {
        setSortBy(newSortBy);
        setSortDirection("asc");
      }
    }, [sortBy]);

    const handleSearch = useCallback((e) => {
      setSearchTerm(e.target.value);
    }, []);

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw]">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-semibold">
              Rooms for {selectedHotel?.hotel_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>
              <Select
                value={sortBy}
                onValueChange={handleSort}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Room Category</SelectItem>
                  <SelectItem value="type">Room Type</SelectItem>
                  <SelectItem value="remaining">Remaining Rooms</SelectItem>
                  <SelectItem value="cost">Cost per Night</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onAddRoom}>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            </div>

            <Table className="rounded-md border">
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground">Category</TableHead>
                  <TableHead className="text-primary-foreground">Type</TableHead>
                  <TableHead className="text-primary-foreground">Source</TableHead>
                  <TableHead className="text-primary-foreground">Max Guests</TableHead>
                  <TableHead className="text-primary-foreground">Check-in</TableHead>
                  <TableHead className="text-primary-foreground">Check-out</TableHead>
                  <TableHead className="text-primary-foreground">Booked</TableHead>
                  <TableHead className="text-primary-foreground">Used</TableHead>
                  <TableHead className="text-primary-foreground">Remaining</TableHead>
                  <TableHead className="text-primary-foreground">Cost/Night</TableHead>
                  <TableHead className="text-primary-foreground">Cost/Room</TableHead>
                  <TableHead className="text-primary-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRooms.map((room) => (
                  <TableRow key={room.room_id}>
                    <TableCell className="font-medium">{room.room_category}</TableCell>
                    <TableCell>{room.room_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal bg-background hover:bg-background/80">
                        {room.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground border-secondary/20">
                        {room.max_guests}
                      </Badge>
                    </TableCell>
                    <TableCell>{room.check_in_date}</TableCell>
                    <TableCell>{room.check_out_date}</TableCell>
                    <TableCell>{room.booked}</TableCell>
                    <TableCell>{room.used}</TableCell>
                    <TableCell>
                      <Badge
                        variant={room.remaining > 0 ? "default" : "destructive"}
                        className="font-medium bg-primary/90 hover:bg-primary"
                      >
                        {room.remaining}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      £{room["price_per_night_(gbp)"]}
                    </TableCell>
                    <TableCell className="font-medium">
                      £{room["total_room_cost_(gbp)"]}
                    </TableCell>
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
    );
  });

  // Update the main component's dialog state management
  const handleAddRoomClick = useCallback(() => {
    setIsRoomDialogOpen(true);
  }, []);

  const handleEditRoomClick = useCallback((room) => {
    setEditingRoom(room);
    setIsEditDialogOpen(true);
  }, []);

  const handleCloseRoomDialog = useCallback(() => {
    setIsRoomDialogOpen(false);
    setEditingRoom(null);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingRoom(null);
  }, []);

  // Unique filter options
  const getUnique = (arr, key) => [...new Set(arr.map(item => item[key]).filter(Boolean))];

  // Filtering logic
  const filterHotels = (items) => {
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
      // Package type filter
      const packageTypeMatch =
        filters.packageType === "all" || item.package_type === filters.packageType;
      // City filter
      const cityMatch =
        filters.city === "all" || (item.city && item.city === filters.city);
      return searchMatch && eventMatch && packageTypeMatch && cityMatch;
    });
  };

  // Sorting logic
  const filteredHotels = useMemo(() => {
    let result = filterHotels(hotels);
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        if (["stars"].includes(sortColumn)) {
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
  }, [hotels, filters, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHotels.slice(startIndex, endIndex);

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedHotels(currentItems.map((hotel) => hotel.hotel_id));
    } else {
      setSelectedHotels([]);
    }
  };
  const handleSelectHotel = (hotelId, checked) => {
    if (checked) {
      setSelectedHotels((prev) => [...prev, hotelId]);
    } else {
      setSelectedHotels((prev) => prev.filter((id) => id !== hotelId));
    }
  };
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedHotels([]);
  };
  const handleBulkDelete = async () => {
    if (selectedHotels.length === 0) return;
    setIsBulkDeleting(true);
    try {
      for (const hotelId of selectedHotels) {
        await handleDeleteHotel(hotelId);
      }
      setSelectedHotels([]);
    } catch (error) {
      // error already handled in handleDeleteHotel
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search hotels..."
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
            {getUnique(hotels, "event_name").map((event) => (
              <SelectItem key={event} value={event}>{event}</SelectItem>
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
            {getUnique(hotels, "package_type").map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.city}
          onValueChange={(value) => setFilters({ ...filters, city: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {getUnique(hotels, "city").map((city) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
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
                  onClick={() => setSortColumn("hotel_name")}
                  className={sortColumn === "hotel_name" ? "font-semibold text-primary" : ""}
                >
                  Hotel {sortColumn === "hotel_name" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("event_name")}
                  className={sortColumn === "event_name" ? "font-semibold text-primary" : ""}
                >
                  Event {sortColumn === "event_name" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("package_type")}
                  className={sortColumn === "package_type" ? "font-semibold text-primary" : ""}
                >
                  Package Type {sortColumn === "package_type" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortColumn("stars")}
                  className={sortColumn === "stars" ? "font-semibold text-primary" : ""}
                >
                  Stars {sortColumn === "stars" && "✓"}
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
                case "hotel_name": return "Hotel";
                case "event_name": return "Event";
                case "package_type": return "Package Type";
                case "stars": return "Stars";
                default: return sortColumn;
              }
            })()}</span> ({sortDirection === "asc" ? "A-Z" : "Z-A"})</span>
          </div>
          <div className="flex gap-4 items-center">
            {isSelectionMode && selectedHotels.length > 0 && (
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
                    Delete Selected ({selectedHotels.length})
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
              onClick={() => setIsAddHotelDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Hotel
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-muted">
              {isSelectionMode && (
                <TableHead className="w-[50px] text-xs py-2">
                  <Checkbox
                    checked={selectedHotels.length === currentItems.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead className="w-[250px] text-xs py-2 font-bold">Hotel Name</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">Event</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">Package Type</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">City Tax</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">VAT</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">Resort Fee</TableHead>
              <TableHead className="w-[120px] text-xs py-2 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((hotel) => (
              <TableRow key={hotel.hotel_id} className="hover:bg-muted/50">
                {isSelectionMode && (
                  <TableCell className="text-xs py-1.5">
                    <Checkbox
                      checked={selectedHotels.includes(hotel.hotel_id)}
                      onCheckedChange={(checked) => handleSelectHotel(hotel.hotel_id, checked)}
                      aria-label={`Select ${hotel.hotel_name}`}
                      className="h-4 w-4"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium text-xs py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{hotel.hotel_name}</span>
                    <Badge variant="secondary" className="font-medium bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 flex items-center text-center align-middle gap-1 px-2 py-0.5">
                      {hotel.stars}
                      <Star className="fill-primary text-primary" />
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <Badge variant="outline" className="font-semibold bg-background">
                    {hotel.event_name}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <Badge variant="secondary" className="font-normal bg-secondary/80 hover:bg-secondary">
                    {hotel.package_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {hotel.city_tax_value === 'included' ? (
                        <Badge variant="secondary" className="font-normal bg-secondary/80 hover:bg-secondary">Included</Badge>
                      ) : hotel.city_tax_value === 'percentage' ? (
                        `${hotel.city_tax_amount}%`
                      ) : (
                        `${getCurrencySymbol(getHotelCurrency(hotel.hotel_id))}${hotel.city_tax_amount}`
                      )}
                    </span>
                    {hotel.city_tax_value !== 'included' && (
                      <span className="text-xs text-muted-foreground">
                        {hotel.city_tax_type?.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {hotel.vat_type === 'included' ? (
                        <Badge variant="secondary" className="font-normal bg-secondary/80 hover:bg-secondary">Included</Badge>
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
                <TableCell className="text-xs py-1.5">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {hotel.resort_fee_per_night === 0 ? (
                        "None"
                      ) : (
                        <>
                          {getCurrencySymbol(getHotelCurrency(hotel.hotel_id))}{hotel.resort_fee_per_night}
                          <span className="text-xs text-muted-foreground ml-1">
                            per night
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs py-1.5">
                  <div className="flex justify-start gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedHotel(hotel)}
                      className="h-7"
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
                      className="h-7 w-7"
                    >
                      {isEditingHotel ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Pencil className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(hotel)}
                      disabled={isDeletingHotel && deletingHotelId === hotel.hotel_id}
                      className="h-7 w-7"
                    >
                      {isDeletingHotel && deletingHotelId === hotel.hotel_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
        <RoomsTableView
          isOpen={!!selectedHotel}
          onOpenChange={() => setSelectedHotel(null)}
          onAddRoom={handleAddRoomClick}
        />
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
        onOpenChange={handleCloseRoomDialog}
        mode="add"
      />

      {/* Edit Room Dialog */}
      <RoomDialog
        isOpen={isEditDialogOpen}
        onOpenChange={handleCloseEditDialog}
        mode="edit"
        room={editingRoom}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredHotels.length)} of {filteredHotels.length} hotels
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedHotels.length} selected hotel(s).
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default HotelsWithRooms; 