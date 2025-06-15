import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { jwtDecode } from "jwt-decode";
import { CategoriesTable } from "@/components/ui/categoriesTable";
import { Ticket } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/ui/app-header";

function CategoriesPage() {
  const [user, setUser] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") || "events";

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
    navigate(`/packages?tab=${newTab}`);
  };

  return (
      <div className="flex h-screen w-full mt-6">
        <main className="flex-1 overflow-y-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <Ticket className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ticket Categories</h1>
          </div>
          <CategoriesTable />
        </main>
      </div>
  );
}

export { CategoriesPage };
