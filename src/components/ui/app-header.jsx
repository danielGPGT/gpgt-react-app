import {
  Bell,
  Search,
  Keyboard,
  User,
  Package,
  Plane,
  ClipboardList,
  BookOpen,
  HelpCircle,
  Settings,
  Globe,
  Palette,
  BadgePoundSterling,
  Gauge,
} from "lucide-react";
import { SidebarTrigger } from "./sidebar";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { ThemeSelector } from "@/components/ui/theme-selector";

const pages = [
  { name: "Dashboard", path: "/dashboard", icon: Gauge, roles: ["Admin", "Internal Sales", "Operations", "External B2B"] },
  { name: "Pricing", path: "/pricing", icon: BadgePoundSterling, roles: ["Admin", "Internal Sales", "External B2B"] },
  { name: "Packages", path: "/packages", icon: Package, roles: ["Admin"] },
  { name: "Flights", path: "/flights", icon: Plane, roles: ["Admin", "Operations", "Internal Sales"] },
  { name: "Bookings", path: "/bookings", icon: ClipboardList, roles: ["Admin", "Internal Sales", "Operations", "External B2B"] },
  { name: "Inventory", path: "/inventory", icon: Package, roles: ["Admin", "Operations"] },
  { name: "Documentation", path: "/documentation", icon: BookOpen, roles: ["Admin", "Internal Sales", "Operations", "External B2B"] },
  { name: "Instructions", path: "/instructions", icon: HelpCircle, roles: ["Admin", "Internal Sales", "Operations", "External B2B"] },
  { name: "Settings", path: "/settings", icon: Settings, roles: ["Admin", "Internal Sales", "Operations", "External B2B"] },
];

export function AppHeader({ className }) {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("default");
  const [bookings, setBookings] = useState([]);
  const [newBookings, setNewBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (user?.role === 'Admin') {
      const fetchBookings = async () => {
        try {
          const response = await api.get('/bookingfile');
          const bookingsData = Array.isArray(response.data) ? response.data : [response.data];
          setBookings(bookingsData);

          // Check for new bookings
          const seenResponse = await api.get('/notifications/seen');
          const seenIds = new Set(seenResponse.data);
          const newBookings = bookingsData.filter(booking => !seenIds.has(booking.booking_id));
          setNewBookings(newBookings);
        } catch (error) {
          console.error('Error fetching bookings:', error);
        }
      };

      fetchBookings();
      const interval = setInterval(fetchBookings, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationClick = async () => {
    if (newBookings.length > 0) {
      try {
        const bookingIds = bookings.map(booking => booking.booking_id);
        await api.post('/notifications/seen', { bookingIds });
        setNewBookings([]);
        navigate('/bookings');
      } catch (error) {
        console.error('Error marking notifications as seen:', error);
      }
    } else {
      navigate('/bookings');
    }
  };

  const unreadCount = newBookings.length;
  const isAdmin = user?.role === 'Admin';

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    page.roles.includes(user?.role)
  );

  const handlePageSelect = (path) => {
    navigate(path);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSearch = () => {
    if (filteredPages.length > 0) {
      handlePageSelect(filteredPages[0].path);
    }
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b pb-4",
        className
      )}
    >
      {/* Left side - Sidebar trigger and search */}
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search pages..."
            className="pr-9 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-colors"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted/50"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
              {filteredPages.length > 0 ? (
                <div className="py-1">
                  {filteredPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <button
                        key={page.path}
                        className="w-full px-4 py-2 text-left hover:bg-muted/50 flex items-center gap-2 text-sm"
                        onClick={() => handlePageSelect(page.path)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {page.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No pages found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Notifications, keyboard shortcut, and theme toggle */}
      <div className="flex items-center gap-2">
        {/* Website Link */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted/50"
          onClick={() =>
            window.open("https://grandprixgrandtours.com", "_blank")
          }
        >
          <Globe className="h-5 w-5" />
        </Button>

        {/* Notification Bell - Only show for admin users */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted/50"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>New Bookings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {newBookings.length > 0 ? (
                // Use a Set to ensure unique bookings in the display
                Array.from(new Map(newBookings.map(booking => [booking.booking_id, booking])).values())
                  .map((booking) => (
                    <DropdownMenuItem
                      key={booking.booking_id}
                      className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-muted/50"
                      onClick={handleNotificationClick}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">New Booking</span>
                        <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.booking_ref} - {booking.event_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.lead_traveller_name} • {booking.booking_date}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {booking.status}
                        </span>
                        <span>£{booking.total_sold_gbp}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No new bookings
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Keyboard Shortcut Indicator - Commented out
        <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
          <Keyboard className="h-4 w-4" />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>B
          </kbd>
        </div>
        */}

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile - Commented out
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-muted/50"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.first_name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        */}
      </div>
    </header>
  );
}
