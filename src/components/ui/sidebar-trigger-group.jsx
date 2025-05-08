import { Bell, Search, Keyboard } from "lucide-react";
import { SidebarTrigger } from "./sidebar";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export function SidebarTriggerGroup({ className }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <SidebarTrigger />
      
      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="pl-8 bg-background/50 backdrop-blur-sm"
        />
      </div>

      {/* Notification Bell */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          3
        </span>
      </Button>

      {/* Keyboard Shortcut Indicator */}
      <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
        <Keyboard className="h-4 w-4" />
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>B
        </kbd>
      </div>
    </div>
  );
} 