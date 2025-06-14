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
import { Star, Plus, Trash2, Pencil, Search, Loader2, ChevronDown, Check, ChevronsUpDown, AlertTriangle, Upload, X, Settings } from "lucide-react";
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
import {
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Combobox } from "@/components/ui/combobox";

// Add roomFieldMappings at the top of the file after imports
const roomFieldMappings = {
  room_id: "Room ID",
  hotel_id: "Hotel ID",
  event_id: "Event ID",
  event_name: "Event Name",
  package_id: "Package ID",
  package_type: "Package Type",
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
  hotel_id: "Hotel ID",
  hotel_name: "Hotel Name",
  stars: "Stars",
  city_tax_type: "City Tax Type",
  city_tax_value: "City Tax Value",
  city_tax_amount: "City Tax Amount",
  vat_type: "VAT Type",
  vat_amount: "VAT Amount",
  commission: "Commission",
  resort_fee_per_night: "Resort Fee/Night",
  other_rates: "Other Rates",
  latitude: "Latitude",
  longitude: "Longitude",
  hotel_info: "Hotel Info",
  images: "Images",
  currency: "Currency"
};

// Add ViewRoomsDialog component before the TestHotelRooms component
const ViewRoomsDialog = memo(({ isOpen, onOpenChange, hotel, rooms, onAddRoom, onEditRoom, onDeleteRoom, fetchData, fetchHotelRooms }) => {
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    roomCategory: true,
    roomType: true,
    event: true,
    source: true,
    flexibility: true,
    maxGuests: true,
    booked: true,
    remaining: true,
    checkInOut: true,
    nights: true,
    localPrice: true,
    gbpPrice: true,
    margin: true,
    actions: true
  });

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setShowDeleteRoomDialog(true);
  };

  const confirmDeleteRoom = async () => {
    if (roomToDelete) {
      setIsDeletingRoom(true);
      setDeletingRoomId(roomToDelete.room_id);
      try {
        await onDeleteRoom(roomToDelete.room_id);
        setShowDeleteRoomDialog(false);
        setRoomToDelete(null);
      } finally {
        setIsDeletingRoom(false);
        setDeletingRoomId(null);
      }
    }
  };

  // Group rooms by event
  const roomsByEvent = useMemo(() => {
    const grouped = {};
    rooms.forEach(room => {
      const eventName = room.event_name || 'No Event';
      if (!grouped[eventName]) {
        grouped[eventName] = [];
      }
      grouped[eventName].push(room);
    });
    return grouped;
  }, [rooms]);

  const handleAddRoomForEvent = (eventName) => {
    setEditingRoom({
      hotel_id: hotel.hotel_id,
      event_name: eventName,
      room_flexibility: "non_flex",
      max_guests: 2,
      booked: 0,
      remaining: 0,
      breakfast_included: false,
      breakfast_cost_pp: 0,
      core_per_night_price_local: 0,
      room_margin: "55%"
    });
    setIsRoomDialogOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-xl font-semibold">
            Rooms for {hotel?.hotel_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4">
          <div className="flex justify-between items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.roomCategory}
                  onCheckedChange={() => toggleColumn('roomCategory')}
                >
                  Room Category
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.roomType}
                  onCheckedChange={() => toggleColumn('roomType')}
                >
                  Room Type
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.event}
                  onCheckedChange={() => toggleColumn('event')}
                >
                  Event
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.source}
                  onCheckedChange={() => toggleColumn('source')}
                >
                  Source
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.flexibility}
                  onCheckedChange={() => toggleColumn('flexibility')}
                >
                  Flexibility
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.maxGuests}
                  onCheckedChange={() => toggleColumn('maxGuests')}
                >
                  Max Guests
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.booked}
                  onCheckedChange={() => toggleColumn('booked')}
                >
                  Booked
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.remaining}
                  onCheckedChange={() => toggleColumn('remaining')}
                >
                  Remaining
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.checkInOut}
                  onCheckedChange={() => toggleColumn('checkInOut')}
                >
                  Check In/Out
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.nights}
                  onCheckedChange={() => toggleColumn('nights')}
                >
                  Nights
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.localPrice}
                  onCheckedChange={() => toggleColumn('localPrice')}
                >
                  Local Price
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.gbpPrice}
                  onCheckedChange={() => toggleColumn('gbpPrice')}
                >
                  GBP Price
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.margin}
                  onCheckedChange={() => toggleColumn('margin')}
                >
                  Margin
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setEditingRoom(null);
                setIsRoomDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(90vh-180px)] px-6">
          <div className="space-y-6 pb-4">
            {Object.entries(roomsByEvent).map(([eventName, eventRooms]) => (
              <div key={eventName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{eventName}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {eventRooms.length} {eventRooms.length === 1 ? 'Room' : 'Rooms'}
                  </Badge>
                </div>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow className="hover:bg-muted">
                          {visibleColumns.roomCategory && (
                            <TableHead className="w-[180px] text-xs py-2 font-bold">Room Category</TableHead>
                          )}
                          {visibleColumns.roomType && (
                            <TableHead className="w-[180px] text-xs py-2 font-bold">Room Type</TableHead>
                          )}
                          {visibleColumns.source && (
                            <TableHead className="w-[120px] text-xs py-2 font-bold">Source</TableHead>
                          )}
                          {visibleColumns.flexibility && (
                            <TableHead className="w-[120px] text-xs py-2 font-bold">Flexibility</TableHead>
                          )}
                          {visibleColumns.maxGuests && (
                            <TableHead className="w-[100px] text-xs py-2 font-bold">Max Guests</TableHead>
                          )}
                          {visibleColumns.booked && (
                            <TableHead className="w-[100px] text-xs py-2 font-bold">Booked</TableHead>
                          )}
                          {visibleColumns.remaining && (
                            <TableHead className="w-[100px] text-xs py-2 font-bold">Remaining</TableHead>
                          )}
                          {visibleColumns.checkInOut && (
                            <TableHead className="w-[180px] text-xs py-2 font-bold">Check In/Out</TableHead>
                          )}
                          {visibleColumns.nights && (
                            <TableHead className="w-[100px] text-xs py-2 font-bold">Nights</TableHead>
                          )}
                          {visibleColumns.localPrice && (
                            <TableHead className="w-[150px] text-xs py-2 font-bold">Local Price</TableHead>
                          )}
                          {visibleColumns.gbpPrice && (
                            <TableHead className="w-[150px] text-xs py-2 font-bold">GBP Price</TableHead>
                          )}
                          {visibleColumns.margin && (
                            <TableHead className="w-[120px] text-xs py-2 font-bold">Margin</TableHead>
                          )}
                          <TableHead className="w-[100px] text-xs py-2 font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventRooms.map((room) => (
                          <TableRow key={room.room_id} className="hover:bg-muted/50">
                            {visibleColumns.roomCategory && (
                              <TableCell className="text-xs py-1.5">{room.room_category}</TableCell>
                            )}
                            {visibleColumns.roomType && (
                              <TableCell className="text-xs py-1.5">{room.room_type}</TableCell>
                            )}
                            {visibleColumns.source && (
                              <TableCell className="text-xs py-1.5">{room.source}</TableCell>
                            )}
                            {visibleColumns.flexibility && (
                              <TableCell className="text-xs py-1.5">
                                <Badge variant={room.room_flexibility === "flex" ? "default" : "secondary"}>
                                  {room.room_flexibility === "flex" ? "Flex" : "Non-Flex"}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleColumns.maxGuests && (
                              <TableCell className="text-xs py-1.5">{room.max_guests}</TableCell>
                            )}
                            {visibleColumns.booked && (
                              <TableCell className="text-xs py-1.5">{room.booked}</TableCell>
                            )}
                            {visibleColumns.remaining && (
                              <TableCell className="text-xs py-1.5">{room.remaining}</TableCell>
                            )}
                            {visibleColumns.checkInOut && (
                              <TableCell className="text-xs py-1.5">
                                <div className="flex flex-col">
                                  <span>{room.check_in_date}</span>
                                  <span>{room.check_out_date}</span>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.nights && (
                              <TableCell className="text-xs py-1.5">{room.nights}</TableCell>
                            )}
                            {visibleColumns.localPrice && (
                              <TableCell className="text-xs py-1.5">
                                <div className="flex flex-col gap-1">
                                  <div className="flex flex-row gap-1">
                                    <span className="text-xs text-muted-foreground">Core per night:</span>
                                    <span className="font-medium">
                                      {room.currency_local} {room.core_per_night_price_local}
                                    </span>
                                  </div>
                                  <div className="flex flex-row gap-1">
                                    <span className="text-xs text-muted-foreground">Core + Taxes:</span>
                                    <span className="font-medium">
                                      {room.currency_local} {room.final_per_night_price_local}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.gbpPrice && (
                              <TableCell className="text-xs py-1.5">
                                <div className="flex flex-col gap-1">
                                  <div className="flex flex-row gap-1">
                                    <span className="text-xs text-muted-foreground">Per Night:</span>
                                    <span className="font-medium">
                                      £{room.price_per_night_gbp}
                                    </span>
                                  </div>
                                  <div className="flex flex-row gap-1">
                                    <span className="text-xs text-muted-foreground">Room Cost:</span>
                                    <span className="font-medium">
                                      £{room.total_room_cost_gbp}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.margin && (
                              <TableCell className="text-xs py-1.5">
                                <div className="flex flex-col gap-1">
                                  <div className="flex flex-row gap-1">
                                    <span className="text-xs text-muted-foreground">Room Margin:</span>
                                    <span className="font-medium">{room.room_margin}</span>
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-xs py-1.5">
                              <div className="flex justify-start gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingRoom(room);
                                    setIsEditDialogOpen(true);
                                  }}
                                  className="h-7 w-7"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(room)}
                                  disabled={isDeletingRoom && deletingRoomId === room.room_id}
                                  className="h-7 w-7"
                                >
                                  {isDeletingRoom && deletingRoomId === room.room_id ? (
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
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Add/Edit Room Dialog */}
        <RoomDialog
          isOpen={isRoomDialogOpen}
          onOpenChange={setIsRoomDialogOpen}
          mode="add"
          selectedHotel={hotel}
          handleAddRoom={onAddRoom}
          handleEditRoom={onEditRoom}
          fetchData={fetchData}
          fetchHotelRooms={fetchHotelRooms}
        />

        {/* Edit Room Dialog */}
        <RoomDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          mode="edit"
          room={editingRoom}
          selectedHotel={hotel}
          handleAddRoom={onAddRoom}
          handleEditRoom={onEditRoom}
          fetchData={fetchData}
          fetchHotelRooms={fetchHotelRooms}
        />

        {/* Delete Room Confirmation Dialog */}
        <AlertDialog open={showDeleteRoomDialog} onOpenChange={setShowDeleteRoomDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the room.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteRoomDialog(false)}
                disabled={isDeletingRoom}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRoom}
                disabled={isDeletingRoom}
              >
                {isDeletingRoom ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Room"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add loading overlay for the entire dialog */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Updating rooms...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

function TestHotelRooms() {
  const [hotels, setHotels] = useState([]);
  const [hotelRooms, setHotelRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingHotel, setIsAddingHotel] = useState(false);
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [isDeletingHotel, setIsDeletingHotel] = useState(false);
  const [deletingHotelId, setDeletingHotelId] = useState(null);
  const [isViewRoomsDialogOpen, setIsViewRoomsDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isAddHotelDialogOpen, setIsAddHotelDialogOpen] = useState(false);
  const [isEditHotelDialogOpen, setIsEditHotelDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [showDeleteHotelDialog, setShowDeleteHotelDialog] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [hotelsResponse, roomsResponse] = await Promise.all([
        api.get("hotels"),
        api.get("stock-rooms")
      ]);
      
      // Get all hotels
      const hotelsData = hotelsResponse.data;
      
      // Get all rooms
      const roomsData = roomsResponse.data;
      
      // Associate events with hotels based on their rooms
      const hotelsWithEvents = hotelsData.map(hotel => {
        const hotelRooms = roomsData.filter(room => room.hotel_id === hotel.hotel_id);
        const uniqueEvents = [...new Set(hotelRooms.map(room => room.event_name).filter(Boolean))];
        return {
          ...hotel,
          events: uniqueEvents
        };
      });
      
      setHotels(hotelsWithEvents);
      setHotelRooms(roomsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHotelRooms = async () => {
    try {
      const response = await api.get("stock-rooms");
      setHotelRooms(response.data);
    } catch (error) {
      console.error("Failed to fetch hotel rooms:", error);
      toast.error("Failed to load hotel rooms");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    const events = new Set(hotelRooms.map(room => room.event_name).filter(Boolean));
    return Array.from(events);
  }, [hotelRooms]);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = new Set(hotels.map(hotel => hotel.city).filter(Boolean));
    return Array.from(cities);
  }, [hotels]);

  // Get rooms for selected hotel
  const selectedHotelRooms = useMemo(() => {
    if (!selectedHotel) return [];
    return hotelRooms.filter(room => room.hotel_id === selectedHotel.hotel_id);
  }, [selectedHotel, hotelRooms]);

  // Filter and sort hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const matchesSearch = filters.search === "" || 
        hotel.hotel_name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesEvent = filters.event === "all" || 
        hotel.events?.includes(filters.event);
      const matchesPackageType = filters.packageType === "all" || 
        hotel.package_type === filters.packageType;
      const matchesCity = filters.city === "all" || 
        hotel.city === filters.city;
      
      return matchesSearch && matchesEvent && matchesPackageType && matchesCity;
    }).sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [hotels, filters, sortColumn, sortDirection]);

  // Paginate hotels
  const paginatedHotels = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHotels.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHotels, currentPage]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle sort changes
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Currency helper functions
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

  const getHotelCurrency = (hotelId) => {
    const hotel = hotels.find(h => h.hotel_id === hotelId);
    return hotel?.currency || 'USD'; // Default to USD if no currency found
  };

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedHotels(paginatedHotels.map((hotel) => hotel.hotel_id));
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
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      for (const hotelId of selectedHotels) {
        await handleDeleteHotel(hotelId);
      }
      setSelectedHotels([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      // error already handled in handleDeleteHotel
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Hotel management functions
  const handleAddHotel = async (hotelData) => {
    try {
      setIsAddingHotel(true);
      const hotelId = crypto.randomUUID();
      
      const newHotel = {
        hotel_id: hotelId,
        hotel_name: hotelData.hotel_name,
        stars: parseInt(hotelData.stars) || 0,
        city_tax_type: hotelData.city_tax_type,
        city_tax_value: hotelData.city_tax_value,
        city_tax_amount: parseFloat(hotelData.city_tax_amount) || 0,
        vat_type: hotelData.vat_type,
        vat_amount: parseFloat(hotelData.vat_amount) || 0,
        commission: parseFloat(hotelData.commission) || 0,
        resort_fee_per_night: parseFloat(hotelData.resort_fee_per_night) || 0,
        other_rates: hotelData.other_rates || "",
        latitude: hotelData.latitude || "",
        longitude: hotelData.longitude || "",
        hotel_info: hotelData.hotel_info || "",
        images: hotelData.images || "[]",
        currency: hotelData.currency || "USD",
        events: [],
        rooms: []
      };

      await api.post("hotels", newHotel);
      await fetchData();
      toast.success("Hotel added successfully");
    } catch (error) {
      console.error("Failed to add hotel:", error);
      toast.error("Failed to add hotel");
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

      setIsEditingHotel(true);
      console.log("Starting hotel edit process...");

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

      // Prepare bulk updates
      const updates = Object.entries(changedFields).map(([field, value]) => {
        let formattedValue = value;
        if (field === 'stars') {
          formattedValue = parseInt(value);
        } else if (['city_tax_amount', 'vat_amount', 'commission', 'resort_fee_per_night'].includes(field)) {
          formattedValue = parseFloat(value);
        }
        return {
          column: field,
          value: formattedValue
        };
      });

      // Use bulk update endpoint
      await api.put(`hotels/hotel_id/${editingHotel.hotel_id}/bulk`, updates);

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
      await api.delete(`hotels/hotel_id/${hotelId}`);
      toast.success("Hotel deleted successfully");
      await fetchData(); // Ensure we wait for the data to be fetched
    } catch (error) {
      console.error("Failed to delete hotel:", error);
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

  // Add handleEditRoom function
  const handleEditRoom = async ({ room_id, field, value }) => {
    try {
      const allowedFields = [
        "room_id", "event_id", "package_id", "package_type", "room_category", "room_type", "source", "room_flexibility", "max_guests", "booked", "check_in_date", "check_out_date", "currency_local", "breakfast_included", "breakfast_cost_pp", "core_per_night_price_local", "room_margin", "attrition_group"
      ];
      if (!allowedFields.includes(field)) {
        console.warn(`Field ${field} is not allowed for update.`);
        return;
      }
      // Convert boolean values to uppercase strings
      const formattedValue = typeof value === 'boolean' ? value.toString().toUpperCase() : value;
      await api.put(`stock-rooms/room_id/${room_id}/bulk`, [{
        column: field,
        value: formattedValue
      }]);
      toast.success("Room updated successfully");
      // Refresh both rooms and hotels data
      await Promise.all([
        fetchData(),
        fetchHotelRooms()
      ]);
    } catch (error) {
      console.error("Failed to update room:", error);
      toast.error(error.response?.data?.error || "Failed to update room");
    }
  };

  // Update handleAddRoom to also refresh data
  const handleAddRoom = async (roomData) => {
    try {
      const newRoom = {
        room_id: crypto.randomUUID(),
        event_id: roomData.event_id,
        hotel_id: roomData.hotel_id,
        package_type: roomData.package_type,
        room_category: roomData.room_category,
        room_type: roomData.room_type,
        source: roomData.source,
        room_flexibility: roomData.room_flexibility,
        max_guests: roomData.max_guests,
        booked: roomData.booked,
        check_in_date: roomData.check_in_date,
        check_out_date: roomData.check_out_date,
        currency_local: roomData.currency_local,
        breakfast_included: roomData.breakfast_included,
        breakfast_cost_pp: roomData.breakfast_cost_pp,
        core_per_night_price_local: roomData.core_per_night_price_local,
        room_margin: roomData.room_margin,
        attrition_group: roomData.attrition_group
      };
      await api.post("stock-rooms", newRoom);
      toast.success("Room added successfully");
      // Refresh both rooms and hotels data
      await Promise.all([
        fetchData(),
        fetchHotelRooms()
      ]);
    } catch (error) {
      console.error("Failed to add room:", error);
      toast.error(error.response?.data?.error || "Failed to add room");
    }
  };

  // Update handleDeleteRoom to also refresh data
  const handleDeleteRoom = async (roomId) => {
    try {
      await api.delete(`stock-rooms/room_id/${roomId}`);
      toast.success("Room deleted successfully");
      
      // Refresh both rooms and hotels data
      await Promise.all([
        fetchData(),
        fetchHotelRooms()
      ]);
    } catch (error) {
      console.error("Failed to delete room:", error);
      toast.error(error.response?.data?.error || "Failed to delete room");
    }
  };

  // Update the View Rooms button click handler
  const handleViewRooms = (hotel) => {
    setSelectedHotel(hotel);
    setIsViewRoomsDialogOpen(true);
  };

  // Add a helper function to format event ID
  const formatEventId = (eventId) => {
    if (!eventId) return "No Event";
    // Take the first 8 characters of the event ID for display
    return `Event ${eventId.substring(0, 8)}...`;
  };

  if (isLoading) {
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
            {uniqueEvents.map((eventName) => (
              <SelectItem key={eventName} value={eventName}>
                {eventName}
              </SelectItem>
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
                    checked={selectedHotels.length === paginatedHotels.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="h-4 w-4"
                  />
                </TableHead>
              )}
              <TableHead className="w-[250px] text-xs py-2 font-bold">Hotel Name</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">Events</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">City Tax</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">VAT</TableHead>
              <TableHead className="w-[150px] text-xs py-2 font-bold">Resort Fee</TableHead>
              <TableHead className="w-[120px] text-xs py-2 font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedHotels.map((hotel) => (
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
                  <div className="flex flex-wrap gap-1">
                    {hotel.events?.length > 0 ? (
                      hotel.events.map((eventName, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="font-semibold bg-background"
                        >
                          {eventName}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="font-semibold bg-background">
                        No Events
                      </Badge>
                    )}
                  </div>
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
                      variant={hotel.rooms?.length === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleViewRooms(hotel)}
                      className="h-7"
                    >
                      {hotel.rooms?.length === 0 ? (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Room
                        </>
                      ) : (
                        "View Rooms"
                      )}
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {currentPage * itemsPerPage - itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredHotels.length)} of {filteredHotels.length} hotels
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
          <span className="text-sm">Page {currentPage} of {Math.ceil(filteredHotels.length / itemsPerPage)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(filteredHotels.length / itemsPerPage), prev + 1))}
            disabled={currentPage === Math.ceil(filteredHotels.length / itemsPerPage)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Add Hotel Dialog */}
      <HotelDialog
        isOpen={isAddHotelDialogOpen}
        onOpenChange={setIsAddHotelDialogOpen}
        mode="add"
        isAddingHotel={isAddingHotel}
        isEditingHotel={isEditingHotel}
        handleAddHotel={handleAddHotel}
        handleEditHotel={handleEditHotel}
      />

      {/* Edit Hotel Dialog */}
      <HotelDialog
        isOpen={isEditHotelDialogOpen}
        onOpenChange={setIsEditHotelDialogOpen}
        mode="edit"
        hotel={editingHotel}
        isAddingHotel={isAddingHotel}
        isEditingHotel={isEditingHotel}
        handleAddHotel={handleAddHotel}
        handleEditHotel={handleEditHotel}
      />

      {/* Add ViewRoomsDialog */}
      <ViewRoomsDialog
        isOpen={isViewRoomsDialogOpen}
        onOpenChange={setIsViewRoomsDialogOpen}
        hotel={selectedHotel}
        rooms={selectedHotelRooms}
        onAddRoom={handleAddRoom}
        onEditRoom={handleEditRoom}
        onDeleteRoom={handleDeleteRoom}
        fetchData={fetchData}
        fetchHotelRooms={fetchHotelRooms}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedHotels.length} selected hotel{selectedHotels.length > 1 ? 's' : ''}.
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
              onClick={confirmBulkDelete}
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

      {/* Delete Hotel Confirmation Dialog */}
      <AlertDialog open={showDeleteHotelDialog} onOpenChange={setShowDeleteHotelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the hotel and all its associated rooms.
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
                "Delete Hotel"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Hotel Dialog Component
const HotelDialog = ({ isOpen, onOpenChange, mode = "add", hotel = null, isAddingHotel, isEditingHotel, handleAddHotel, handleEditHotel }) => {
  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && hotel) {
      return { ...hotel };
    }
    return {
      hotel_name: "",
      stars: 5,
      city_tax_type: "per_room",
      city_tax_value: "percentage",
      city_tax_amount: 0,
      vat_type: "percentage",
      vat_amount: 0,
      commission: 0,
      resort_fee_per_night: 0,
      other_rates: "",
      latitude: "",
      longitude: "",
      hotel_info: "",
      images: "[]",
      currency: "USD"
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hotel && mode === "edit") {
      setFormData({ ...hotel });
    } else if (mode === "add") {
      setFormData({
        hotel_name: "",
        stars: 5,
        city_tax_type: "per_room",
        city_tax_value: "percentage",
        city_tax_amount: 0,
        vat_type: "percentage",
        vat_amount: 0,
        commission: 0,
        resort_fee_per_night: 0,
        other_rates: "",
        latitude: "",
        longitude: "",
        hotel_info: "",
        images: "[]",
        currency: "USD"
      });
    }
  }, [hotel, mode]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (mode === "add") {
        await handleAddHotel(formData);
      } else {
        await handleEditHotel({ ...hotel, ...formData });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit hotel:", error);
      toast.error("Failed to submit hotel");
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
            {(isAddingHotel || isEditingHotel || isSubmitting) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {mode === "edit" ? "Updating hotel..." : "Adding hotel..."}
                  </p>
                </div>
              </div>
            )}

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
                              longitude: hotelInfo.longitude || prev.longitude,
                              city_tax_type: hotelInfo.city_tax_info?.type || prev.city_tax_type,
                              city_tax_value: hotelInfo.city_tax_info?.value_type || prev.city_tax_value,
                              city_tax_amount: hotelInfo.city_tax_info?.amount || prev.city_tax_amount,
                              vat_type: hotelInfo.vat_info?.type || prev.vat_type,
                              vat_amount: hotelInfo.vat_info?.amount || prev.vat_amount,
                              resort_fee_per_night: hotelInfo.resort_fee || prev.resort_fee_per_night,
                              commission: hotelInfo.commission || prev.commission
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
                </div>
                <div className="space-y-3">
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
                      value={formData.resort_fee_per_night}
                      onChange={(e) => setFormData({ ...formData, resort_fee_per_night: parseFloat(e.target.value) })}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAddingHotel || isEditingHotel || isSubmitting} className="h-9">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isAddingHotel || isEditingHotel || isSubmitting} className="h-9">
            {isAddingHotel || isEditingHotel || isSubmitting ? (
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

// Room Dialog Component
const RoomDialog = memo(({ 
  isOpen, 
  onOpenChange, 
  mode = "add", 
  room = null, 
  selectedHotel,
  handleAddRoom,
  handleEditRoom,
  fetchData,
  fetchHotelRooms
}) => {
  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && room) {
      return {
        ...room,
        check_in_date: room.check_in_date || "",
        check_out_date: room.check_out_date || "",
        hotel_id: selectedHotel?.hotel_id || room.hotel_id,
        breakfast_included: room.breakfast_included === true || room.breakfast_included === "true" ? "true" : "false",
        room_flexibility: room.room_flexibility || "non_flex",
        package_type: room.package_type || "Both",
        attrition_group: room.attrition_group || ""
      };
    }
    return {
      hotel_id: selectedHotel?.hotel_id || "",
      event_id: "",
      event_name: "",
      package_id: "",
      package_type: "Both",
      hotel_name: selectedHotel?.hotel_name || "",
      room_category: "",
      room_type: "",
      source: "",
      room_flexibility: "Flex",
      max_guests: 2,
      booked: 0,
      used: 0,
      remaining: 0,
      check_in_date: "",
      check_out_date: "",
      nights: 0,
      currency_local: "GBP",
      breakfast_included: "false",
      breakfast_cost_pp: 0,
      core_per_night_price_local: 0,
      final_per_night_price_local: 0,
      price_per_night_gbp: 0,
      extra_night_price_gbp: 0,
      total_room_cost_gbp: 0,
      room_margin: "55%",
      extra_night_margin: "28%",
      attrition_group: ""
    };
  });

  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  // Fetch events when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
      const response = await api.get("events");
      setEvents(response.data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load events");
    }
  };

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
          hotel_name: selectedHotel?.hotel_name || room.hotel_name,
          breakfast_included: room.breakfast_included === true || room.breakfast_included === "true" ? "true" : "false",
          room_flexibility: room.room_flexibility || "non_flex",
          package_type: room.package_type || "Both",
          package_id: room.package_id || "",
          used: parseInt(room.used) || 0,
          remaining: parseInt(room.remaining) || 0,
          nights: parseInt(room.nights) || 0,
          final_per_night_price_local: parseFloat(room.final_per_night_price_local) || 0,
          price_per_night_gbp: parseFloat(room.price_per_night_gbp) || 0,
          extra_night_price_gbp: parseFloat(room.extra_night_price_gbp) || 0,
          total_room_cost_gbp: parseFloat(room.total_room_cost_gbp) || 0
        });
        setDateRange({
          from: room.check_in_date ? new Date(room.check_in_date.split("/").reverse().join("-")) : null,
          to: room.check_out_date ? new Date(room.check_out_date.split("/").reverse().join("-")) : null,
        });
      } else {
        setFormData({
          hotel_id: selectedHotel?.hotel_id || "",
          event_id: "",
          event_name: "",
          package_id: "",
          package_type: "Both",
          hotel_name: selectedHotel?.hotel_name || "",
          room_category: "",
          room_type: "",
          source: "",
          room_flexibility: "Flex",
          max_guests: 2,
          booked: 0,
          used: 0,
          remaining: 0,
          check_in_date: "",
          check_out_date: "",
          nights: 0,
          currency_local: "GBP",
          breakfast_included: "false",
          breakfast_cost_pp: 0,
          core_per_night_price_local: 0,
          final_per_night_price_local: 0,
          price_per_night_gbp: 0,
          extra_night_price_gbp: 0,
          total_room_cost_gbp: 0,
          room_margin: "55%",
          extra_night_margin: "28%",
          attrition_group: ""
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
        // Prepare bulk updates for all changed fields
        const updates = Object.entries(formData)
          .filter(([field, value]) => {
            if (field === 'breakfast_included') {
              const originalValue = room.breakfast_included === true || room.breakfast_included === "true" ? "true" : "false";
              return value !== originalValue;
            }
            return value !== room[field];
          })
          .map(([field, value]) => ({
            column: field,
            value: field === 'breakfast_included' ? value : value
          }));

        if (updates.length > 0) {
          await api.put(`stock-rooms/room_id/${room.room_id}/bulk`, updates);
          toast.success("Room updated successfully");
          // Refresh both rooms and hotels data
          await Promise.all([
            fetchData(),
            fetchHotelRooms()
          ]);
        } else {
          toast.info("No changes were made");
        }
      } else {
        // For new rooms, ensure breakfast_included is properly formatted
        const newRoomData = {
          ...formData,
          breakfast_included: formData.breakfast_included
        };
        await handleAddRoom(newRoomData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit room:", error);
      toast.error(error.response?.data?.error || "Failed to update room");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, room, handleAddRoom, onOpenChange, fetchData, fetchHotelRooms]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
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

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hotel</Label>
                  <Input
                    value={selectedHotel?.hotel_name || ""}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event <span className="text-destructive">*</span></Label>
                  <Combobox
                    options={events.map(event => ({
                      value: event.event,
                      label: event.event,
                      id: event.event_id
                    }))}
                    value={formData.event_name}
                    onChange={(value) => {
                      const selectedEvent = events.find(e => e.event === value);
                      if (selectedEvent) {
                        handleFieldChange('event_id', selectedEvent.event_id);
                        handleFieldChange('event_name', selectedEvent.event);
                      }
                    }}
                    placeholder="Select event"
                    className="w-full"
                  />
                </div>
              </div>

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
                  <Label>Package Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.package_type}
                    onValueChange={(value) => handleFieldChange('package_type', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select package type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Both">Both</SelectItem>
                      <SelectItem value="Grandstand">Grandstand</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Attrition Group</Label>
                  <Input
                    value={formData.attrition_group}
                    onChange={(e) => handleFieldChange('attrition_group', e.target.value)}
                  />
                </div>
              </div>

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
                  <Label>Currency <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.currency_local}
                    onValueChange={(value) => handleFieldChange('currency_local', value)}
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

              {/* Margins */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Room Margin <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.room_margin}
                      onChange={(e) => handleFieldChange('room_margin', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
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

export default TestHotelRooms;
