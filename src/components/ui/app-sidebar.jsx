import {
  Calendar,
  Home,
  Inbox,
  BadgePoundSterling,
  Search,
  Gauge,
  Settings,
  LogOut,
  Package,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/components/theme-provider";

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
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: ClipboardList,
  },
];

function AppSidebar() {
  const location = useLocation();
  const { theme } = useTheme();
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
    <Sidebar className="bg-card border-r">
      <SidebarHeader className="flex flex-col mt-5 items-start gap-2 px-4 py-3 border-b">
        <img
          src={theme === "dark" ? "/src/assets/imgs/gpgt_logo_light.svg" : "/src/assets/imgs/gpgt_logo_dark.svg"}
          alt="Grand Prix Logo"
          className="w-full hover:opacity-90 transition"
        />
        <div className="text-left pt-4">
          <h2 className="text-sm font-bold text-foreground">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-sm text-primary font-semibold capitalize pt-3">
            {user.role}
          </p>
          <p className="text-sm text-muted-foreground">{user.company}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`flex items-center gap-2 hover:bg-accent ${
                        isActive ? "text-primary bg-accent" : "text-muted-foreground"
                      }`}
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

      <SidebarFooter>
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Appearance</span>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dark mode</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppSidebar };
