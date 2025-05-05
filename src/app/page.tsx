'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login');
      }
    });
  }, []);

  return (
    <div>
      <h1>Welcome</h1>
    </div>
  );
}
