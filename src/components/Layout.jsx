import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1">
          <ThemeToggleButton />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
} 