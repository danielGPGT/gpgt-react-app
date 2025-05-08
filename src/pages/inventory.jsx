import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Inventory } from "@/components/ui/inventory";
import { jwtDecode } from "jwt-decode";
import { Package } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/ui/app-header";

function InventoryPage() {
  const [user, setUser] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") || "tickets";

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

  const handleTabChange = (newTab) => {
    navigate(`/inventory?tab=${newTab}`);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-8 w-full">
          <AppHeader className="mb-6" />
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Inventory</h1>
          </div>
          <Inventory defaultTab={tab} onTabChange={handleTabChange} />
        </main>
      </div>
    </SidebarProvider>
  );
}

export { InventoryPage };