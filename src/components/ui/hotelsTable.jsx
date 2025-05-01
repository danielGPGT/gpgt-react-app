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

function HotelsTable() {
  const [hotels, setHotels] = useState([]);
  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const itemsPerPage = 10;

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    stars: "all",
    packageType: "all"
  });

  // Form state
  const initialHotelState = {
    event_name: "",
    package_id: "",
    hotel_id: "",
    hotel_name: "",
    stars: 5,
    package_type: "",
    hotel_info: "",
    longitude: "",
    latitude: "",
    images: ""
  };

  const [newHotel, setNewHotel] = useState(initialHotelState);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [hotelsRes, packagesRes, eventsRes] = await Promise.all([
        api.get("hotels"),
        api.get("packages"),
        api.get("event")
      ]);
      
      const validHotels = Array.isArray(hotelsRes.data) ? hotelsRes.data : [];
      const validPackages = Array.isArray(packagesRes.data) ? packagesRes.data : [];
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

  // Get unique values for filters
  const getUniqueStars = () => {
    const uniqueStars = [...new Set(hotels.map(item => item.stars))];
    return uniqueStars.filter(stars => stars !== undefined && stars !== null).sort((a, b) => a - b);
  };

  // Get unique package types from hotels
  const getUniquePackageTypes = () => {
    const uniqueTypes = [...new Set(hotels.map(item => item.package_type))];
    return uniqueTypes.filter(type => type);
  };

  // Filter functions
  const filterHotels = (items) => {
    return items.filter(item => {
      const searchMatch = filters.search === "" || 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(filters.search.toLowerCase())
        );

      const starsMatch = filters.stars === "all" || item.stars === parseInt(filters.stars);
      const packageTypeMatch = filters.packageType === "all" || item.package_type === filters.packageType;

      return searchMatch && starsMatch && packageTypeMatch;
    });
  };

  const handleAddHotel = async () => {
    try {
      const hotelData = {
        ...newHotel,
        hotel_id: crypto.randomUUID()
      };

      await api.post("hotels", hotelData);
      toast.success("Hotel added successfully");
      setIsAddDialogOpen(false);
      fetchInitialData();
      setNewHotel(initialHotelState);
    } catch (error) {
      console.error("Failed to add hotel:", error);
      toast.error("Failed to add hotel");
    }
  };

  const handleEditHotel = async () => {
    try {
      const hotelData = {
        ...editingHotel
      };

      await api.put(`hotels/${editingHotel.hotel_id}`, hotelData);
      toast.success("Hotel updated successfully");
      setIsEditDialogOpen(false);
      setEditingHotel(null);
      fetchInitialData();
    } catch (error) {
      console.error("Failed to update hotel:", error);
      toast.error("Failed to update hotel");
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    try {
      await api.delete(`hotels/${hotelId}`);
      toast.success("Hotel deleted successfully");
      fetchInitialData();
    } catch (error) {
      console.error("Failed to delete hotel:", error);
      toast.error("Failed to delete hotel");
    }
  };

  const openEditDialog = (hotel) => {
    const preparedHotel = {
      ...initialHotelState,
      ...hotel
    };
    setEditingHotel(preparedHotel);
    setIsEditDialogOpen(true);
  };

  // Apply filters and calculate pagination
  const filteredHotels = filterHotels(hotels);
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHotels.slice(startIndex, endIndex);

  const HotelDialog = ({ isOpen, onOpenChange, mode = "add" }) => {
    const isEdit = mode === "edit";
    const dialogTitle = isEdit ? "Edit Hotel" : "Add New Hotel";
    const dialogDescription = isEdit ? "Update the hotel details" : "Fill in the details for the new hotel";
    const buttonText = isEdit ? "Update Hotel" : "Add Hotel";
    const handleSubmit = isEdit ? handleEditHotel : handleAddHotel;
    
    const formData = isEdit ? editingHotel || initialHotelState : newHotel;
    const setFormData = isEdit ? setEditingHotel : setNewHotel;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          if (!isEdit) {
            setNewHotel(initialHotelState);
          }
          setEditingHotel(null);
        }
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel_name">Hotel Name</Label>
                  <Input
                    id="hotel_name"
                    value={formData?.hotel_name || ""}
                    onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stars">Stars</Label>
                  <Select
                    value={String(formData?.stars || 5)}
                    onValueChange={(value) => setFormData({ ...formData, stars: parseInt(value) })}
                  >
                    <SelectTrigger>
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

            {/* Package Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Package Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="package_type">Package Type</Label>
                  <Select
                    value={formData?.package_type || ""}
                    onValueChange={(value) => setFormData({ ...formData, package_type: value })}
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_name">Event</Label>
                  <Select
                    value={formData?.event_name || ""}
                    onValueChange={(value) => setFormData({ ...formData, event_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.length > 0 ? (
                        events.map((event) => (
                          <SelectItem key={event.event_id} value={event.event}>
                            {event.event}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No events available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Location Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={formData?.longitude || ""}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={formData?.latitude || ""}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Additional Information</h4>
              <div className="space-y-2">
                <Label htmlFor="hotel_info">Hotel Information</Label>
                <Textarea
                  id="hotel_info"
                  value={formData?.hotel_info || ""}
                  onChange={(e) => setFormData({ ...formData, hotel_info: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="images">Image URLs (comma-separated)</Label>
                <Input
                  id="images"
                  value={formData?.images || ""}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="Enter image URLs separated by commas"
                />
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

  const renderStars = (count) => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ));
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading hotels...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Hotels</h3>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Hotel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hotels..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-8"
            />
          </div>
        </div>
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
          onValueChange={(value) => setFilters({ ...filters, packageType: value })}
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
          <TableHeader>
            <TableRow>
              <TableHead>Hotel Name</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Package Type</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.hotel_id}>
                <TableCell className="font-medium">{item.hotel_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {renderStars(item.stars)}
                  </div>
                </TableCell>
                <TableCell>{item.package_type}</TableCell>
                <TableCell>{item.event_name}</TableCell>
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
                      onClick={() => handleDeleteHotel(item.hotel_id)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, filteredHotels.length)} of {filteredHotels.length} hotels
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
    </div>
  );
}

export { HotelsTable };
