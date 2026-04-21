import { useState, useEffect, useRef } from 'react';
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
  const [isLocked, setIsLocked] = useState(false);
  // Ref to avoid stale closure in timeout
  const firstPinRef = useRef('');

  useEffect(() => {
    setMounted(true);
    setIsLocked(auth.isLocked());
    if (!auth.isPinSet()) {
      setStep('setup');
    }
  }, []);

  function handleKey(key: string) {
    if (isLocked) return;
    setError('');

    if (key === 'del') {
      setConfirmPin(p => p.slice(0, -1));
      setPin(p => p.slice(0, -1));
      return;
    }

    if (key >= '0' || key === '0') {
      if (step === 'confirm' && confirmPin.length < 6) {
        const val = confirmPin + key;
        setConfirmPin(val);
        if (val.length === 6) {
          // Compare with ref, not state (avoid stale closure)
          const first = firstPinRef.current;
          setTimeout(() => {
            if (first === val) {
              auth.setPin(first);
              router.push('/dashboard');
            } else {
              setError("PIN'ler eşleşmiyor.");
              setConfirmPin('');
              setPin('');
              setStep('setup');
              firstPinRef.current = '';
            }
          }, 100);
        }
      } else if ((step === 'setup' || step === 'enter') && pin.length < 6) {
        const val = pin + key;
        if (step === 'setup') {
          setPin(val);
          if (val.length === 6) {
            firstPinRef.current = val;
            setStep('confirm');
          }
        } else {
          // enter mode
          setPin(val);
          if (val.length === 6) {
            setTimeout(() => {
              if (auth.verifyPin(val)) {
                router.push('/dashboard');
              } else {
                setIsLocked(auth.isLocked());
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
        }
      }
    }
  }

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-secondary)',
      }}>
        <div style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</div>
      </div>
    );
  }

  const currentValue = step === 'confirm' ? confirmPin : pin;
  const isSetup = step === 'setup';
  const isConfirm = step === 'confirm';
  const isEnter = step === 'enter';

  const dots = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      style={{
        width: 14, height: 14, borderRadius: '50%',
        background: i < currentValue.length ? 'var(--accent)' : 'var(--border)',
        transform: i < currentValue.length ? 'scale(1.2)' : 'scale(1)',
        transition: 'all 0.15s',
      }}
    />
  ));

  const title = isConfirm ? "PIN'i Onayla" : isSetup ? "PIN Oluştur" : "PIN Gir";
  const subtitle = isConfirm ? "PIN'ni tekrar gir" : isSetup ? '6 haneli PIN belirle' : error || "PIN'ni gir";

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', background: 'var(--bg-secondary)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Aile Kartı</div>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 40, textAlign: 'center', fontSize: 14 }}>
        {subtitle}
      </div>

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
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
          {dots}
        </div>
      )}

      {error && !isLocked && (
        <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, maxWidth: 260, width: '100%',
      }}>
        {[1,2,3,4,5,6,7,8,9,'',0].map((k, i) => {
          if (k === '') return <div key={i} style={{ height: 56 }} />;
          return (
            <button
              key={i}
              onClick={() => handleKey(String(k))}
              style={{
                height: 56, borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                fontSize: 20, fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {k}
            </button>
          );
        })}
      </div>

      {(isEnter || isConfirm) && (
        <button
          onClick={() => handleKey('del')}
          style={{
            marginTop: 12, background: 'none', border: 'none',
            color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          ← Sil
        </button>
      )}

      {isConfirm && (
        <button
          onClick={() => {
            setStep('setup');
            setConfirmPin('');
            setPin('');
            firstPinRef.current = '';
          }}
          style={{
            marginTop: 8, background: 'none', border: 'none',
            color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          ← Geri
        </button>
      )}
    </div>
  );
}
