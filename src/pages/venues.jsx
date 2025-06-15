import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { MapPin } from "lucide-react";
import { VenuesTable } from "@/components/ui/venuesTable";
import api from "@/lib/api";
import { toast } from "sonner";

function VenuesPage() {
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVenue, setNewVenue] = useState(null);

  const fetchVenues = async () => {
    try {
      const response = await api.get("/venues");
      setVenues(response.data);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      toast.error("Failed to fetch venues");
    }
  };

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }

    fetchCurrentUser();
    fetchVenues();
  }, []);

  const openEditDialog = (venue) => {
    setEditingVenue({ ...venue });
    setIsEditDialogOpen(true);
  };

  const handleEditVenue = async (venue) => {
    try {
      setIsEditing(true);

      // Compare with original venue to find changed fields
      const originalVenue = venues.find((v) => v.venue_id === venue.venue_id);
      if (!originalVenue) {
        toast.error("Original venue not found");
        return;
      }

      // Prepare updates array with only changed fields
      const updates = Object.entries(venue)
        .filter(([key, value]) => {
          // Skip venue_id as it's the identifier
          if (key === 'venue_id') return false;
          
          // Compare values, handling null/undefined cases
          const originalValue = originalVenue[key];
          const newValue = value;
          
          // Handle empty string vs null comparison
          if (originalValue === null && newValue === "") return false;
          if (originalValue === "" && newValue === null) return false;
          
          return originalValue !== newValue;
        })
        .map(([key, value]) => ({
          column: key,
          value: value
        }));

      // Check if there are any changes
      if (updates.length === 0) {
        toast.info("No changes were made to the venue");
        setIsEditDialogOpen(false);
        return;
      }

      // Make bulk update request
      await api.put(`/venues/venue_id/${venue.venue_id}/bulk`, updates);

      // Update local state immediately
      setVenues(prevVenues => 
        prevVenues.map(v => 
          v.venue_id === venue.venue_id ? { ...v, ...venue } : v
        )
      );

      toast.success("Venue updated successfully");
      setIsEditDialogOpen(false);
      setEditingVenue(null);
      
      // Fetch fresh data in the background
      fetchVenues();
    } catch (error) {
      console.error("Failed to update venue:", error);
      toast.error("Failed to update venue");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteVenue = async (venue) => {
    try {
      setIsDeleting(true);
      await api.delete(`/venues/venue_id/${venue.venue_id}`);
      toast.success("Venue deleted successfully");
      setShowDeleteDialog(false);
      setVenueToDelete(null);
      fetchVenues();
    } catch (error) {
      console.error("Failed to delete venue:", error);
      toast.error("Failed to delete venue");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddVenue = (venueData) => {
    setNewVenue(venueData);
    setIsAddDialogOpen(true);
  };

  return (
      <main className="w-full">

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <MapPin className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                GPGT's Venues
              </h2>
            </div>
          </div>

          <div className="flex w-full justify-between mt-6 gap-6">
            <VenuesTable 
              onVenuesLoaded={setVenues}
              editingVenue={editingVenue}
              setEditingVenue={setEditingVenue}
              isEditDialogOpen={isEditDialogOpen}
              setIsEditDialogOpen={setIsEditDialogOpen}
              isDeleting={isDeleting}
              setIsDeleting={setIsDeleting}
              venueToDelete={venueToDelete}
              setVenueToDelete={setVenueToDelete}
              showDeleteDialog={showDeleteDialog}
              setShowDeleteDialog={setShowDeleteDialog}
              onEditVenue={handleEditVenue}
              isEditing={isEditing}
              openEditDialog={openEditDialog}
              isAddDialogOpen={isAddDialogOpen}
              setIsAddDialogOpen={setIsAddDialogOpen}
              newVenue={newVenue}
              setNewVenue={setNewVenue}
            />
          </div>
      </main>
  );
}

export { VenuesPage };
