import { Login } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { PricingSheet } from "@/pages/pricing";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/privateRoute"; // <-- Protects pages
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <PrivateRoute>
              <PricingSheet />
            </PrivateRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
