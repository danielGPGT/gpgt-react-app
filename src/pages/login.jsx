import { useState } from 'react';
import api from '../lib/api'; // Axios instance
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', { email, password });
      const { token } = res.data;
      localStorage.setItem('token', token); // Save JWT
      window.location.href = '/dashboard'; // Redirect after login
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form className="flex flex-col space-y-4 w-80" onSubmit={handleLogin}>
        <Input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
        />
        <Input
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit">Login</Button>
      </form>
    </div>
  );
}

export { Login };
