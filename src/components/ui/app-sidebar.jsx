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
  Plane,
  ClipboardList,
  HardHat,
  ChevronDown,
  User,
  Bell,
  CreditCard,
  Star,
  BookOpen,
  HelpCircle,
  Ticket,
  Bed,
  Bus,
  Coffee,
  Hotel,
  CalendarDays,
  Layers
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { jwtDecode } from "jwt-decode";
import api from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Menu items with their allowed roles
const menuItems = [
  {
    title: "My Dashboard",
    url: "/dashboard",
    icon: Gauge,
    allowedRoles: ["Admin", "Internal Sales", "Operations", "External B2B"],
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: ClipboardList,
    allowedRoles: ["Admin", "Operations"],
  },
  {
    title: "Pricing",
    url: "/pricing",
    icon: BadgePoundSterling,
    allowedRoles: ["Admin", "Internal Sales", "External B2B"],
  },
  {
    title: "Inventory",
    icon: Package,
    allowedRoles: ["Admin", "Operations"],
    subItems: [
      {
        title: "Tickets",
        url: "/inventory?tab=tickets",
        icon: Ticket,
      },
      {
        title: "Hotels",
        url: "/inventory?tab=hotels",
        icon: Hotel,
      },
      {
        title: "Rooms",
        url: "/inventory?tab=rooms",
        icon: Bed,
      },
      {
        title: "Circuit Transfers",
        url: "/inventory?tab=circuits",
        icon: Bus,
      },
      {
        title: "Airport Transfers",
        url: "/inventory?tab=airport",
        icon: Bus,
      },
      {
        title: "Lounge Passes",
        url: "/inventory?tab=lounge",
        icon: Coffee,
      },
    ],
  },
  {
    title: "Flights & Transport",
    url: "/flights",
    icon: Plane,
    allowedRoles: ["Admin", "Operations", "Internal Sales"],
  },
  {
    title: "Package Builder",
    icon: HardHat,
    allowedRoles: ["Admin"],
    subItems: [
      {
        title: "Events",
        url: "/packages?tab=events",
        icon: CalendarDays,
      },
      {
        title: "Packages",
        url: "/packages?tab=packages",
        icon: Package,
      },
      {
        title: "Package Tiers",
        url: "/packages?tab=tiers",
        icon: Layers,
      },
    ],
  },
  {
    title: "Payments",
    icon: BadgePoundSterling,
    allowedRoles: ["Admin"],
    subItems: [
      {
        title: "Ticket Payments",
        url: "/",
        icon: Ticket,
      },
      {
        title: "Hotel Payments",
        url: "/",
        icon: Hotel,
      },
      {
        title: "Circuit Payments",
        url: "/",
        icon: Bus,
      },
      {
        title: "Airport Payments",
        url: "/",
        icon: Bus,
      },
      
    ],
  },
  
];

export function AppSidebar() {
  const location = useLocation();
  const { theme, mode } = useTheme();
  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    role: "",
    company: "",
  });
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Fetch user data to get the latest avatar
        api.get('/users').then(response => {
          const userData = response.data.find(user => user.user_id === decoded.user_id);
          if (userData) {
            setUser({
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role,
              company: userData.company,
              avatar: userData.avatar || "",
            });
          }
        }).catch(error => {
          console.error("Failed to fetch user data:", error);
        });
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const toggleExpand = (title) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Filter menu items based on user's role
  const filteredMenuItems = menuItems.filter(item => 
    item.allowedRoles.includes(user.role)
  );

  return (
    <Sidebar collapsible="icon" className="bg-sidebar">
      <SidebarHeader className="flex flex-row items-center gap-3 pb-4 pt-7">
        {/* Icon/avatar */}
        <div className="bg-foreground rounded-md flex items-center justify-center w-10 h-10 aspect-square p-1.5 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
          <img
            src={mode === "dark" ? "/src/assets/imgs/gpgt-small-light.png" : "/src/assets/imgs/gpgt-small-dark.png"}
            alt="Company Icon"
            className="w-full h-full aspect-square object-contain"
          />
        </div>
        {/* Company and role - hidden when collapsed */}
        <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
          <span className="font-bold text-foreground truncate">{user.company || "Company"}</span>
          <span className="text-xs text-muted-foreground font-medium capitalize truncate">{user.role || "Role"}</span>
        </div>
      </SidebarHeader>
      <div className="border-b mx-2"></div>
      <SidebarContent className="py-2">
        
        <SidebarGroup>
          <SidebarGroupLabel className="mr- text-muted-foreground group-data-[collapsible=icon]:hidden">Quick Links</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const isActive = location.pathname === item.url;
                const isExpanded = expandedItems[item.title];

                if (item.subItems) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <div className="flex flex-col">
                        <SidebarMenuButton
                          onClick={() => toggleExpand(item.title)}
                          tooltip={item.title}
                          className={cn(
                            "flex items-center gap-2 w-full",
                            isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                            !isActive && "text-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className={cn(
                            "!w-4 !h-4",
                            isActive ? "text-primary-foreground" : "text-primary"
                          )} />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                          <ChevronDown 
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden",
                              isExpanded && "transform rotate-180"
                            )} 
                          />
                        </SidebarMenuButton>
                        {isExpanded && !document.querySelector('[data-collapsible="icon"]') && (
                          <div className="pl-6 mt-1 space-y-1">
                            {item.subItems.map((subItem) => (
                              <SidebarMenuButton
                                key={subItem.title}
                                asChild
                                tooltip={subItem.title}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                              >
                                <a href={subItem.url} className="flex items-center gap-2">
                                  <subItem.icon className={cn(
                                    "!w-4 !h-4",
                                    location.pathname === subItem.url ? "text-primary-foreground" : "text-primary"
                                  )} />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuButton>
                            ))}
                          </div>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        "flex items-center gap-2",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                        !isActive && "text-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <a href={item.url} className="flex items-center gap-2">
                        <item.icon className={cn(
                          "!w-4 !h-4",
                          isActive ? "text-primary-foreground" : "text-primary"
                        )} />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
        <div className="flex flex-col gap-4 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Settings"
                className="flex items-center gap-2 text-foreground hover:bg-muted hover:text-foreground"
              >
                <a href="/settings" className="flex items-center gap-2">
                  <Settings className={cn(
                    "!w-4 !h-4",
                    location.pathname === "/settings" ? "text-primary-foreground" : "text-primary"
                  )} />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Documentation"
                className="flex items-center gap-2 text-foreground hover:bg-muted hover:text-foreground"
              >
                <a href="/documentation" className="flex items-center gap-2">
                  <BookOpen className={cn(
                    "!w-4 !h-4",
                    location.pathname === "/documentation" ? "text-primary-foreground" : "text-primary"
                  )} />
                  <span className="group-data-[collapsible=icon]:hidden">Documentation</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Instructions"
                className="flex items-center gap-2 text-foreground hover:bg-muted hover:text-foreground"
              >
                <a href="/instructions" className="flex items-center gap-2">
                  <HelpCircle className={cn(
                    "!w-4 !h-4",
                    location.pathname === "/instructions" ? "text-primary-foreground" : "text-primary"
                  )} />
                  <span className="group-data-[collapsible=icon]:hidden">Instructions</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-muted transition group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
                <Avatar className="w-12 h-12 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.first_name || "User"}
                    className="w-full h-full object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-bold text-foreground text-sm truncate">{user.first_name} {user.last_name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.role || "Role"}</span>
                </div>
                <ChevronDown className="ml-auto w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 ">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.first_name || "User"}
                      className="w-full h-full object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.first_name?.[0]}
                      {user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-muted-foreground">{user.role || "Role"}</div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
              <a href="/dashboard" className="flex items-center">
                <Gauge className={cn(
                  "w-4 h-4 mr-2",
                  location.pathname === "/dashboard" ? "text-primary-foreground" : "text-primary"
                )} /> My Dashboard
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/my-account" className="flex items-center">
                  <User className={cn(
                    "w-4 h-4 mr-0",
                    location.pathname === "/my-account" ? "text-primary-foreground" : "text-primary"
                  )} /> My Account
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-0 text-primary" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
