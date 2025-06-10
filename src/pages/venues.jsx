import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { jwtDecode } from "jwt-decode";
import { MapPin } from "lucide-react";
import { AppHeader } from "@/components/ui/app-header";
import { VenuesTable } from "@/components/ui/venuesTable";
import VenuesMap from "@/components/ui/venuesMap";
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
    console.log('Opening edit dialog for venue:', venue);
    setEditingVenue({ ...venue });
    setIsEditDialogOpen(true);
  };

  const handleEditVenue = async (venue) => {
    try {
      setIsEditing(true);

      // Compare with original venue to find changed fields
      const changedFields = {};
      Object.keys(venue).forEach((key) => {
        if (venue[key] !== venues.find((v) => v.venue_id === venue.venue_id)?.[key]) {
          changedFields[key] = venue[key];
        }
      });

      // Only update if there are changes
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes were made");
        setIsEditDialogOpen(false);
        return;
      }

      // Update each changed field
      for (const [field, value] of Object.entries(changedFields)) {
        await api.put(`/venues/venue_id/${venue.venue_id}`, {
          column: field,
          value: value
        });
      }

      toast.success("Venue updated successfully");
      setIsEditDialogOpen(false);
      setEditingVenue(null);
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
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="p-8">
          <AppHeader className="mb-6" />

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <MapPin className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                GPGT's Venues
              </h2>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-background mb-6">
            <VenuesMap 
              venues={venues} 
              onEditVenue={openEditDialog}
              onDeleteVenue={handleDeleteVenue}
              onAddVenue={handleAddVenue}
              isDeleting={isDeleting}
              venueToDelete={venueToDelete}
              setVenueToDelete={setVenueToDelete}
              showDeleteDialog={showDeleteDialog}
              setShowDeleteDialog={setShowDeleteDialog}
            />
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
        </div>
      </main>
    </SidebarProvider>
  );
}

export { VenuesPage };
