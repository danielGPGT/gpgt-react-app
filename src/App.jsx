import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { PricingSheet } from "@/pages/pricing";
import { InventoryPage } from "@/pages/inventory";
import { BookingsPage } from "@/pages/bookings";
import { Routes, Route } from "react-router-dom";
import RoleBasedRoute from "./components/roleBasedRoute";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Protected Routes with Role-Based Access */}
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
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales"]}>
              <PricingSheet />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Operations"]}>
              <InventoryPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <RoleBasedRoute allowedRoles={["Admin", "Internal Sales", "Operations", "External B2B"]}>
              <BookingsPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
