import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // <-- FIXED!
import api from '@/lib/api'; // Adjust if path is different
import { Events } from '@/components/ui/events';



function Dashboard() {
  const [user, setUser] = useState({ first_name: '', last_name: '', role: '', company: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token); // <-- FIXED!
      setUser({
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        role: decoded.role,
        company: decoded.company
      });
    }
  }, []);

  return (
    
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-2">Welcome, {user.first_name} {user.last_name}</h2>
      <p>Role: {user.role}</p>
      <p>Company: {user.company}</p>
      <Events/>
    </div>
  );
}

export { Dashboard };

