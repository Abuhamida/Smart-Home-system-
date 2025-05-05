'use client'
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else {
      setEmail('');
      setPassword('');
      router.push('/dashboard');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 shadow-xl rounded-xl">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <input
        type="email"
        placeholder="Email"
        className="input"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <input
        type="password"
        placeholder="Password"
        className="input mt-2"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="btn mt-4" onClick={handleLogin}>
        Login
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
