import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/lib/auth';

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!auth.isPinSet()) {
      router.replace('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [ready]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Yükleniyor...</div>
    </div>
  );
}
