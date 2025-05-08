'use client';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import { AdminDashboard } from "../components/ui/adminDashboard";
import { Gauge } from "lucide-react";
import { AppHeader } from "@/components/ui/app-header";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode(token);
        setRole(decoded.role);

        const res = await api.get("/users");
        const users = res.data;

        // Try match by user_id or email depending on your token
        const currentUser = users.find(
          (u) => u.user_id === decoded.user_id || u.email === decoded.email
        );

        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }

    fetchCurrentUser();
  }, []);

  const renderDashboardContent = () => {
    switch (role) {
      case "Admin":
        return <AdminDashboard />;
      case "Internal Sales":
        return <SalesDashboard />;
      case "Operations":
        return <OperationsDashboard />;
      case "External B2B":
        return <B2BDashboard />;
      default:
        return (
          <div className="text-center text-gray-400">
            No dashboard available for your role.
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="p-8">
        <AppHeader className="mb-6" />

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <Gauge className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">
                {user ? `${user.first_name}'s Dashboard` : "Loading..."}
              </h2>
            </div>
          </div>

          <div className="flex w-full justify-between mt-6 gap-6">
            {/* Render role-specific dashboard */}
            {renderDashboardContent()}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

function SalesDashboard() {
  return (
    <div className="w-full p-8 bg-gray-100 rounded-lg shadow">
      Welcome to the Sales Dashboard
    </div>
  );
}

function OperationsDashboard() {
  return (
    <div className="w-full p-8 bg-gray-100 rounded-lg shadow">
      Welcome to the Operations Dashboard
    </div>
  );
}

function B2BDashboard() {
  return (
    <div className="w-full p-8 bg-gray-100 rounded-lg shadow">
      Welcome to the B2B Dashboard
    </div>
  );
}

export { Dashboard };
