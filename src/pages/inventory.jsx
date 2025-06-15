import { useEffect, useState } from "react";
import { Inventory } from "@/components/ui/inventory";
import { jwtDecode } from "jwt-decode";
import { Package } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

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
      <div className="flex h-screen w-full mt-6">
        <main className="flex-1 overflow-y-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Inventory</h1>
          </div>
          <Inventory defaultTab={tab} onTabChange={handleTabChange} />
        </main>
      </div>
  );
}

export { InventoryPage };