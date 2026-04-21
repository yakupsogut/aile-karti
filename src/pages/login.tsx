import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/lib/auth';

const MAX_ATTEMPTS = 3;

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'setup' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!auth.isPinSet()) setStep('setup');
  }, []);

  const handleKey = (key: string) => {
    setError('');
    if (key === 'del') {
      if (step === 'confirm') setConfirmPin((p) => p.slice(0, -1));
      else setPin((p) => p.slice(0, -1));
      return;
    }
    if (step === 'confirm' && confirmPin.length < 6) {
      setConfirmPin((p) => p + key);
    } else if (step === 'setup' && pin.length < 6) {
      setPin((p) => p + key);
    } else if (step === 'enter' && pin.length < 6) {
      setPin((p) => p + key);
    }

    if (step === 'enter' && pin.length === 6) {
      setTimeout(() => {
        if (auth.verifyPin(pin)) {
          router.push('/dashboard');
        } else {
          const attempts = auth.getAttempts();
          if (attempts >= MAX_ATTEMPTS) {
            setError('Çok fazla deneme. PIN\'i sıfırla.');
          } else {
            setError(`Yanlış PIN. ${MAX_ATTEMPTS - attempts} hakkın kaldı.`);
          }
          setPin('');
        }
      }, 100);
    }

    if (step === 'setup' && pin.length === 6) {
      setStep('confirm');
    }
    if (step === 'confirm' && confirmPin.length === 6) {
      if (pin === confirmPin) {
        auth.setPin(pin);
        router.push('/dashboard');
      } else {
        setError("PIN'ler eşleşmiyor. Tekrar dene.");
        setPin('');
        setConfirmPin('');
        setStep('setup');
      }
    }
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</div>
      </div>
    );
  }

  const isLocked = auth.isLocked();
  const isSetup = step === 'setup';
  const isConfirm = step === 'confirm';

  const dots = (val: string) =>
    Array.from({ length: 6 }, (_, i) => (
      <div key={i} className={`pin-dot${i < val.length ? ' filled' : ''}`} />
    ));

  const subtitle = isConfirm
    ? 'PIN\'ni tekrar gir'
    : isSetup
    ? '6 haneli PIN belirle'
    : error || 'PIN\'ni gir';

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--bg-secondary)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Aile Kartı</div>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 40, textAlign: 'center' }}>{subtitle}</div>

      {isLocked ? (
        <button
          className="btn btn-secondary"
          style={{ marginBottom: 16 }}
          onClick={() => {
            if (confirm('PIN sıfırlanacak. Devam?')) {
              auth.resetPin();
              window.location.reload();
            }
          }}
        >
          PIN'i Sıfırla
        </button>
      ) : (
        <>
          <div className="pin-grid">
            {dots(isConfirm ? confirmPin : pin)}
          </div>
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}
        </>
      )}

      <div className="pin-keypad">
        {[1,2,3,4,5,6,7,8,9,'',0,'del'].map((k, i) => {
          if (k === '') return <div key={i} className="pin-key empty" />;
          if (k === 'del') return (
            <button key={i} className="pin-key" onClick={() => handleKey('del')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-6"/><path d="M9 14l6-6"/><path d="M15 14l6-6"/></svg>
            </button>
          );
          return <button key={i} className="pin-key" onClick={() => handleKey(String(k))}>{k}</button>;
        })}
      </div>
    </div>
  );
}
