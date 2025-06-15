import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { BookingsTable } from "@/components/ui/bookingsTable";
import { jwtDecode } from "jwt-decode";
import { BookingsOpsTable } from "@/components/ui/bookingsOpsTable";
import { ClipboardList } from "lucide-react";
import { AppHeader } from "@/components/ui/app-header";

function BookingsPage() {
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

  // Determine which table to render based on user role
  const renderBookingsTable = () => {
    if (!user) return null;

    // Check if user has admin role
    if (user.role === 'Admin') {
      return <BookingsTable />;
    }
    
    // Check if user has operations role
    if (user.role === 'Operations') {
      return <BookingsOpsTable />;
    }
  };

  return (
      <main className="w-full">

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <ClipboardList className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                GPGT's Bookings
              </h2>
            </div>
          </div>

          <div className="flex w-full justify-between mt-6 gap-6">
          {renderBookingsTable()}
        </div>
      </main>
  );
}

export { BookingsPage };
