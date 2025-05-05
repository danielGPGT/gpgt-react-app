import { useEffect, useState } from "react";
import { DynamicBreadcrumb } from "@/components/ui/dy-breadcrumb";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { BookingsTable } from "@/components/ui/bookingsTable";
import { jwtDecode } from "jwt-decode";

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="p-8">
          <div className="flex gap-6 items-center">
            <SidebarTrigger />
            <DynamicBreadcrumb />
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-bold">
              GPGT's Bookings
            </h2>
          </div>

          <div className="flex w-full justify-between mt-6 gap-6">
            <BookingsTable />
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

export { BookingsPage };
