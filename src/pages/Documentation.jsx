import { BookOpen } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { AppHeader } from "@/components/ui/app-header";

export default function Documentation() {
  return (
    <main className="w-full">

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Documentation</h1>
            </div>
          </div>

          <div className="grid gap-8">
            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  Welcome to the GPGT documentation. This section provides comprehensive guides and documentation to help you start working with our platform as quickly as possible.
                </p>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Booking Management</h3>
                  <p className="text-muted-foreground">
                    Learn how to manage bookings, view schedules, and handle customer reservations.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Inventory Control</h3>
                  <p className="text-muted-foreground">
                    Understand how to track and manage inventory across different locations.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Pricing Management</h3>
                  <p className="text-muted-foreground">
                    Set up and manage pricing strategies for different services and packages.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  Detailed API documentation for developers looking to integrate with our platform.
                </p>
              </div>
            </section>
          </div>
      </main>
  );
} 