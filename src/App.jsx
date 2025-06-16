import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { InventoryPage } from "@/pages/inventory";
import { BookingsPage } from "@/pages/bookings";
import { FlightsPage } from "@/pages/flights";
import { PackagesPage } from "@/pages/packages";
import { CategoriesPage } from "@/pages/categories";
import { MyAccount } from "@/pages/my-account";
import { SettingsPage } from "@/pages/settings";
import Documentation from "@/pages/Documentation";
import Instructions from "@/pages/Instructions";
import { Routes, Route } from "react-router-dom";
import { VenuesPage } from "@/pages/venues";
import { EventsPage } from "@/pages/events";
import { FlightPage } from "@/pages/flight";
import RoleBasedRoute from "./components/roleBasedRoute";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";
import { Toaster } from "sonner";
import Pricing from "@/pages/Pricing";
import { AppLayout } from "@/components/layout/app-layout";

function App() {
  return (
    <ThemeProvider>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "External B2B"]}>
              <AppLayout>
                <Pricing />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <AppLayout>
                <InventoryPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations"]}>
              <AppLayout>
                <BookingsPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/flights"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <AppLayout>
                <FlightsPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/flight"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <AppLayout>
                <FlightPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/packages"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations"]}>
              <AppLayout>
                <PackagesPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations"]}>
              <AppLayout>
                <CategoriesPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/venues"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <AppLayout>
                <VenuesPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <AppLayout>
                <EventsPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/documentation"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <AppLayout>
                <Documentation />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/instructions"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <AppLayout>
                <Instructions />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/my-account"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <AppLayout>
                <MyAccount />
              </AppLayout>
            </RoleBasedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
