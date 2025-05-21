import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { jwtDecode } from "jwt-decode";
import { MapPin } from "lucide-react";
import { AppHeader } from "@/components/ui/app-header";
import { VenuesTable } from "@/components/ui/venuesTable";

function VenuesPage() {
  const [user, setUser] = useState(null);

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
  }, []);

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

          <div className="flex w-full justify-between mt-6 gap-6">
            <VenuesTable />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

export { VenuesPage };
