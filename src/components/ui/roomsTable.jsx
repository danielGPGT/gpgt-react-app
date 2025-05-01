import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Filter, Pencil } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";

function RoomsTable() {
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const itemsPerPage = 10;

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    hotel: "all",
    roomType: "all",
    source: "all",
  });

  // Form state
  const initialRoomState = {
    event_name: "",
    hotel_id: "",
    room_id: "",
    hotel_name: "",
    room_category: "",
    room_type: "",
    source: "",
    room_flexibility: "",
    max_guests: 2,
    "breakfast_(2_people)": "included",
    booked: 0,
    used: 0,
    remaining: 0,
    "currency_(local)": "",
    "per_night_price_(local)": 0,
    check_in_date: "",
    check_out_date: "",
  };

  const [newRoom, setNewRoom] = useState(initialRoomState);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [roomsRes, hotelsRes] = await Promise.all([
        api.get("Stock%20-%20rooms"),
        api.get("hotels")
      ]);
      
      const validRooms = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      const validHotels = Array.isArray(hotelsRes.data) ? hotelsRes.data : [];

      setRooms(validRooms);
      setHotels(validHotels);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      setRooms([]);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const getUniqueHotels = () => {
    const uniqueHotels = [...new Set(rooms.map(item => item.hotel_name))];
    return uniqueHotels.filter(hotel => hotel);
  };

  const getUniqueRoomTypes = () => {
    const uniqueTypes = [...new Set(rooms.map(item => item.room_type))];
    return uniqueTypes.filter(type => type);
  };

  const getUniqueSources = () => {
    const uniqueSources = [...new Set(rooms.map(item => item.source))];
    return uniqueSources.filter(source => source);
  };

  // Filter functions
  const filterRooms = (items) => {
    return items.filter(item => {
      const searchMatch = filters.search === "" || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      const hotelMatch = filters.hotel === "all" || item.hotel_name === filters.hotel;
      const roomTypeMatch = filters.roomType === "all" || item.room_type === filters.roomType;
      const sourceMatch = filters.source === "all" || item.source === filters.source;

      return searchMatch && hotelMatch && roomTypeMatch && sourceMatch;
    });
  };

  const handleAddRoom = async () => {
    try {
      const roomData = {
        ...newRoom,
        room_id: crypto.randomUUID(),
        remaining: newRoom.booked - newRoom.used
      };

      await api.post("Stock%20-%20rooms", roomData);
      toast.success("Room added successfully");
      setIsAddDialogOpen(false);
      fetchInitialData();
      setNewRoom(initialRoomState);
    } catch (error) {
      console.error("Failed to add room:", error);
      toast.error("Failed to add room");
    }
  };

  const handleEditRoom = async () => {
    try {
      const roomData = {
        ...editingRoom,
        remaining: editingRoom.booked - editingRoom.used
      };

      await api.put(`Stock%20-%20rooms/${editingRoom.room_id}`, roomData);
      toast.success("Room updated successfully");
      setIsEditDialogOpen(false);
      setEditingRoom(null);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update room:", error);
      toast.error("Failed to update room");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await api.delete(`Stock%20-%20rooms/${roomId}`);
      toast.success("Room deleted successfully");
      fetchInitialData();
    } catch (error) {
      console.error("Failed to delete room:", error);
      toast.error("Failed to delete room");
    }
  };

  const openEditDialog = (room) => {
    const hotelObj = hotels.find(h => h.hotel_id === room.hotel_id);
    
    const preparedRoom = {
      ...initialRoomState,
      ...room,
      hotel_id: hotelObj?.hotel_id || "",
      hotel_name: room.hotel_name || ""
    };
    setEditingRoom(preparedRoom);
    setIsEditDialogOpen(true);
  };

  // Apply filters and calculate pagination
  const filteredRooms = filterRooms(rooms);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredRooms.slice(startIndex, endIndex);

  const calculatePricePerNight = (price, nights) => {
    if (!price || !nights || nights === 0) return 0;
    return (price / nights).toFixed(2);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Convert from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    // Convert from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const RoomDialog = ({ isOpen, onOpenChange, mode = "add" }) => {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit ? "Edit Room" : "Add New Room";
    const dialogDescription = isEdit ? "Update the room details" : "Fill in the details for the new room";
    const buttonText = isEdit ? "Update Room" : "Add Room";
    const handleSubmit = isEdit ? handleEditRoom : handleAddRoom;
    
    const formData = isEdit ? editingRoom || initialRoomState : newRoom;
    const setFormData = isEdit ? setEditingRoom : setNewRoom;

    const [dateRange, setDateRange] = useState({
      from: formData.check_in_date ? new Date(formData.check_in_date.split('/').reverse().join('-')) : null,
      to: formData.check_out_date ? new Date(formData.check_out_date.split('/').reverse().join('-')) : null
    });

    // Update form data when date range changes
    const handleDateRangeChange = (range) => {
      setDateRange(range);
      if (range?.from) {
        setFormData({
          ...formData,
          check_in_date: format(range.from, 'dd/MM/yyyy'),
          check_out_date: range.to ? format(range.to, 'dd/MM/yyyy') : ''
        });
      } else {
        setFormData({
          ...formData,
          check_in_date: '',
          check_out_date: ''
        });
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          if (!isEdit) {
            setNewRoom(initialRoomState);
          }
          setEditingRoom(null);
        }
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Hotel Selection and Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Hotel & Room Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel">Hotel</Label>
                  <Select
                    value={formData?.hotel_id || ""}
                    onValueChange={(value) => {
                      const selectedHotel = hotels.find(h => h?.hotel_id === value);
                      setFormData({ 
                        ...formData, 
                        hotel_id: value,
                        hotel_name: selectedHotel?.hotel_name || ""
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((hotel) => (
                        <SelectItem 
                          key={hotel?.hotel_id || crypto.randomUUID()}
                          value={hotel?.hotel_id || ""}
                        >
                          {hotel?.hotel_name || "Unnamed Hotel"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room_type">Room Type</Label>
                  <Input
                    id="room_type"
                    value={formData?.room_type || ""}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room_category">Room Category</Label>
                  <Input
                    id="room_category"
                    value={formData?.room_category || ""}
                    onChange={(e) => setFormData({ ...formData, room_category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_guests">Max Guests</Label>
                  <Input
                    id="max_guests"
                    type="number"
                    value={formData?.max_guests || 2}
                    onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Booking Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booked">Booked</Label>
                  <Input
                    id="booked"
                    type="number"
                    value={formData?.booked || 0}
                    onChange={(e) => setFormData({ ...formData, booked: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="used">Used</Label>
                  <Input
                    id="used"
                    type="number"
                    value={formData?.used || 0}
                    onChange={(e) => setFormData({ ...formData, used: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nights">Nights</Label>
                  <Input
                    id="nights"
                    type="number"
                    value={formData?.nights || 0}
                    onChange={(e) => setFormData({ ...formData, nights: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Check-in/out Dates</Label>
                <DatePickerWithRange
                  date={dateRange}
                  setDate={handleDateRangeChange}
                />
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Pricing Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData?.["currency_(local)"] || ""}
                    onChange={(e) => setFormData({ ...formData, "currency_(local)": e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="per_night_price">Price per Night (Local)</Label>
                  <Input
                    id="per_night_price"
                    type="number"
                    value={formData?.["per_night_price_(local)"] || 0}
                    onChange={(e) => setFormData({ ...formData, "per_night_price_(local)": parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Additional Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData?.source || ""}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flexibility">Room Flexibility</Label>
                  <Input
                    id="flexibility"
                    value={formData?.room_flexibility || ""}
                    onChange={(e) => setFormData({ ...formData, room_flexibility: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="attrition_group">Attrition Group</Label>
                  <Input
                    id="attrition_group"
                    value={formData?.attrition_group || ""}
                    onChange={(e) => setFormData({ ...formData, attrition_group: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakfast">Breakfast (2 People)</Label>
                  <Input
                    id="breakfast"
                    value={formData?.["breakfast_(2_people)"] || ""}
                    onChange={(e) => setFormData({ ...formData, "breakfast_(2_people)": e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{buttonText}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading rooms inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Room Inventory</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={filters.hotel}
          onValueChange={(value) => setFilters({ ...filters, hotel: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Hotel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hotels</SelectItem>
            {getUniqueHotels().map((hotel) => (
              <SelectItem key={hotel} value={hotel}>
                {hotel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.roomType}
          onValueChange={(value) => setFilters({ ...filters, roomType: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Room Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Room Types</SelectItem>
            {getUniqueRoomTypes().map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.source}
          onValueChange={(value) => setFilters({ ...filters, source: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {getUniqueSources().map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hotel</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Price/Night</TableHead>
              <TableHead>Nights</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.room_id}>
                <TableCell className="font-medium">{item.hotel_name}</TableCell>
                <TableCell>{item.room_type}</TableCell>
                <TableCell>{item.room_category}</TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell>{item.check_in_date}</TableCell>
                <TableCell>{item.check_out_date}</TableCell>
                <TableCell>{item.booked}</TableCell>
                <TableCell>{item.used}</TableCell>
                <TableCell>
                  <Badge variant={item.remaining > 0 ? "default" : "destructive"}>
                    {item.remaining}
                  </Badge>
                </TableCell>
                <TableCell>£{item["per_night_price_(gbp)"]}</TableCell>
                <TableCell>{item.nights}</TableCell>
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
                      onClick={() => handleDeleteRoom(item.room_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredRooms.length)} of {filteredRooms.length} rooms
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Add Dialog */}
      <RoomDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mode="add"
      />

      {/* Edit Dialog */}
      <RoomDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
      />
    </div>
  );
}

export { RoomsTable };
