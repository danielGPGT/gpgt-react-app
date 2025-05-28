import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function HotelRoomCombinedTable() {
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, type: null, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, data: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hotelsRes, roomsRes] = await Promise.all([
        api.get("copy of hotels"),
        api.get("copy of stock - rooms"),
      ]);
      setHotels(Array.isArray(hotelsRes.data) ? hotelsRes.data : []);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
    } catch (error) {
      setHotels([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Merge rooms with their hotel info by hotel_id
  const combinedRows = useMemo(() => {
    return rooms.map(room => {
      const hotel = hotels.find(h => h.hotel_id === room.hotel_id) || {};
      return { ...hotel, ...room };
    });
  }, [hotels, rooms]);

  // Edit and delete handlers (scaffold)
  const handleEdit = (type, data) => setEditDialog({ open: true, type, data });
  const handleDelete = (type, data) => setDeleteDialog({ open: true, type, data });
  const closeEditDialog = () => setEditDialog({ open: false, type: null, data: null });
  const closeDeleteDialog = () => setDeleteDialog({ open: false, type: null, data: null });

  // Table columns to display
  const columns = [
    { key: "event_name", label: "Event Name" },
    { key: "hotel_name", label: "Hotel Name" },
    { key: "stars", label: "Stars" },
    { key: "package_type", label: "Package Type" },
    { key: "city_tax_type", label: "City Tax" },
    { key: "vat_amount", label: "VAT" },
    { key: "resort_fee_(per_night)", label: "Resort Fee" },
    { key: "room_category", label: "Room Category" },
    { key: "room_type", label: "Room Type" },
    { key: "booked", label: "Booked" },
    { key: "used", label: "Used" },
    { key: "remaining", label: "Remaining" },
    { key: "price_per_night_(gbp)", label: "Price/Night (GBP)" },
    { key: "breakfast_included", label: "Breakfast" },
  ];

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading combined data...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hotels & Rooms Combined Table</h3>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedRows.map((row, idx) => (
            <TableRow key={row.room_id || row.hotel_id || idx}>
              {columns.map(col => (
                <TableCell key={col.key}>
                  {col.key === "breakfast_included"
                    ? row.breakfast_included ? "Yes" : "No"
                    : row[col.key] ?? "-"}
                </TableCell>
              ))}
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => handleEdit("room", row)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete("room", row)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleEdit("hotel", row)}><Pencil className="h-4 w-4 text-blue-500" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete("hotel", row)}><Trash2 className="h-4 w-4 text-orange-500" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Edit and Delete Dialogs (scaffold) */}
      <Dialog open={editDialog.open} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editDialog.type === "hotel" ? "Hotel" : "Room"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">Edit form for {editDialog.type} goes here.</div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>Cancel</Button>
            <Button disabled={saving}>{saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialog.open} onOpenChange={closeDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteDialog.type === "hotel" ? "Hotel" : "Room"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete this {deleteDialog.type}?</div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
            <Button variant="destructive" disabled={saving}>{saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HotelRoomCombinedTable; 