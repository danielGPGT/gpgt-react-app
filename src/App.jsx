import { Button } from "@/components/ui/button"
import { Login } from "@/pages/login"
import { Dashboard } from "@/pages/dashboard"
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/privateRoute'; // <-- Protects pages


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default App;
