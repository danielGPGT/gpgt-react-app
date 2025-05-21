import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { PricingSheet } from "@/pages/pricing";
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
import RoleBasedRoute from "./components/roleBasedRoute";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";
import { Toaster } from "sonner";

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
              <Dashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "External B2B"]}>
              <PricingSheet />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <InventoryPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations"]}>
              <BookingsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/flights"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <FlightsPage />
            </RoleBasedRoute>
          }
        />
          <Route
            path="/packages"
            element={
              <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations"]}>
                <PackagesPage />
              </RoleBasedRoute>
            }
          />
        <Route
          path="/categories"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations"]}>
              <CategoriesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/venues"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations", "Internal Sales"]}>
              <VenuesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <SettingsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/documentation"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <Documentation />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/instructions"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <Instructions />
            </RoleBasedRoute>
          }
        />
        <Route path="/my-account" element={<RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
        <MyAccount />
        </RoleBasedRoute>} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
