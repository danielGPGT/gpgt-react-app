import { AppHeader } from "@/components/ui/app-header";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen p-8">
          <AppHeader />
          <main className="">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 