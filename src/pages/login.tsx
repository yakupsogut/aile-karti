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
  const [shake, setShake] = useState(false);
  const firstPinRef = useRef('');

  useEffect(() => {
    setMounted(true);
    setIsLocked(auth.isLocked());
    if (!auth.isPinSet()) {
      setStep('setup');
    }
  }, []);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  function handleKey(key: string) {
    if (isLocked) return;
    setError('');

    if (key === 'del') {
      setConfirmPin(p => p.slice(0, -1));
      setPin(p => p.slice(0, -1));
      return;
    }

    if (key === 'back') {
      if (step === 'confirm') {
        setStep('setup');
        setConfirmPin('');
        setPin('');
        firstPinRef.current = '';
      }
      return;
    }

    if (/^[0-9]$/.test(key)) {
      if (step === 'confirm' && confirmPin.length < 6) {
        const val = confirmPin + key;
        setConfirmPin(val);
        if (val.length === 6) {
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
              triggerShake();
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
                triggerShake();
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

  const title = isConfirm ? "PIN'i Onayla" : isSetup ? "PIN Oluştur" : "PIN Gir";
  const subtitle = isConfirm ? "PIN'ni tekrar gir" : isSetup ? '6 haneli PIN belirle' : error || "PIN'ni gir";

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', background: 'var(--bg-secondary)',
    }}>
      {/* Logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, var(--accent) 0%, #8B5CF6 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2"/>
          <line x1="2" x2="22" y1="10" y2="10"/>
        </svg>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Aile Kartı</div>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 32, textAlign: 'center', fontSize: 14 }}>
        {subtitle}
      </div>

      {isLocked ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm('PIN sıfırlanacak. Devam?')) {
                auth.resetPin();
                window.location.reload();
              }
            }}
          >
            PIN'i Sıfırla
          </button>
        </div>
      ) : (
        <>
          {/* PIN dots with shake animation */}
          <div
            className="pin-grid"
            style={{
              marginBottom: 28,
              animation: shake ? 'shake 0.4s ease' : 'none',
            }}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`pin-dot${i < currentValue.length ? ' filled' : ''}`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="pin-keypad">
            {[1,2,3,4,5,6,7,8,9,'',0,'del'].map((k, i) => {
              if (k === '') return <div key={i} className="pin-key empty" />;
              if (k === 'del') {
                return (
                  <button
                    key={i}
                    className="pin-key-del"
                    onClick={() => handleKey('del')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/></svg>
                    Sil
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  className="pin-key"
                  onClick={() => handleKey(String(k))}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {isConfirm && (
            <button
              onClick={() => handleKey('back')}
              style={{
                marginTop: 16, background: 'none', border: 'none',
                color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Geri
            </button>
          )}
        </>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
