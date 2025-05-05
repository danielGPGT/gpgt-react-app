import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function RoleBasedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    if (!allowedRoles.includes(userRole)) {
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (error) {
    console.error('Error decoding token:', error);
    return <Navigate to="/" replace />;
  }
}

export default RoleBasedRoute; 