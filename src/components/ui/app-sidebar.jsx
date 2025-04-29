import {
  Calendar,
  Home,
  Inbox,
  BadgePoundSterling,
  Search,
  Gauge,
  Settings,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { jwtDecode } from "jwt-decode";
import api from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "My Dashboard",
    url: "/dashboard",
    icon: Gauge,
  },
  {
    title: "Pricing",
    url: "/pricing",
    icon: BadgePoundSterling,
  },
];



function AppSidebar() {
  const location = useLocation();
  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    role: "",
    company: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUser({
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        role: decoded.role,
        company: decoded.company,
      });
    }
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove saved token
    window.location.href = "/"; // Redirect to login page
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col mt-5 items-start gap-2 px-4 py-3 border-b border-gray-300">
        <img
          src="/src/assets/imgs/gpgt_logo_dark.svg"
          alt="Grand Prix Logo"
          className="w-full hover:opacity-90 transition"
        />
        <div className="text-left pt-2">
          <h2 className="text-sm font-bold">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-sm text-primary font-semibold capitalize pt-3">
            {user.role}
          </p>
          <p className="text-sm text-gray-500">{user.company}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={isActive ? "text-primary" : ""}
                    >
                      <a href={item.url} className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer at the very bottom */}
      <SidebarFooter>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-primary rounded transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppSidebar };
