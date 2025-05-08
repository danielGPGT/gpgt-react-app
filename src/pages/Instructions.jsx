import { HelpCircle } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { AppHeader } from "@/components/ui/app-header";

export default function Instructions() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="p-8">
          <AppHeader className="mb-6" />

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Instructions</h1>
            </div>
          </div>

          <div className="grid gap-8">
            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Quick Start Guide</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Access Your Dashboard</h3>
                    <p className="text-muted-foreground">
                      Log in to your account and navigate to the dashboard to view your overview.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Set Up Your Profile</h3>
                    <p className="text-muted-foreground">
                      Complete your profile information and preferences in the settings section.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Start Managing</h3>
                    <p className="text-muted-foreground">
                      Begin managing your bookings, inventory, and other operations through the main menu.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Common Tasks</h2>
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Creating a New Booking</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Navigate to the Bookings section</li>
                    <li>Click "New Booking"</li>
                    <li>Fill in the required information</li>
                    <li>Review and confirm the booking</li>
                  </ol>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Managing Inventory</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Go to the Inventory section</li>
                    <li>Select the category you want to manage</li>
                    <li>Add or update items as needed</li>
                    <li>Save your changes</li>
                  </ol>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  If you need additional assistance, please contact our support team or refer to the detailed documentation.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
} 