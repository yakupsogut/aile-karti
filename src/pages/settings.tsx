import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { getState, setTheme, getState as gs } from '@/lib/store';
import { auth } from '@/lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const { theme } = gs();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  function cycleTheme() {
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
    setTheme(next);
  }

  function cycleLabel() {
    if (theme === 'system') return 'Sistem tercihi';
    if (theme === 'dark') return 'Koyu';
    return 'Açık';
  }

  async function handleExport() {
    const { persons, cards, expenses } = gs();
    const data = { persons, cards, expenses, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aile-karti-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    (window as any).showToast?.('Veriler indirildi');
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        (window as any).showToast?.('İçe aktarma yakında aktif olacak');
      } catch {
        (window as any).showToast?.('Geçersiz JSON dosyası');
      }
    };
    input.click();
  }

  function handleLogout() {
    if (confirm('Çıkış yapılacak. PIN tekrar gerekecek.')) {
      router.push('/login');
    }
  }

  function handleChangePin() {
    const oldPin = prompt('Mevcut PIN:');
    if (!oldPin || !auth.verifyPin(oldPin)) {
      (window as any).showToast?.('Mevcut PIN yanlış');
      return;
    }
    const newPin = prompt('Yeni PIN (6 hane):');
    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      (window as any).showToast?.('Yeni PIN 6 haneli rakam olmalı');
      return;
    }
    auth.setPin(newPin);
    (window as any).showToast?.('PIN değiştirildi');
  }

  return (
    <Layout title="Ayarlar" showTabs={false}>
      <div className="settings-group">
        <div className="settings-group-title">Görünüm</div>
        <div className="card" style={{ padding: 0 }}>
          <div className="settings-item" onClick={cycleTheme}>
            <div>
              <div className="settings-item-text" style={{ fontSize: 15, fontWeight: 500 }}>Koyu Tema</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{cycleLabel()}</div>
            </div>
            <button className={`toggle-switch${isDark ? ' on' : ''}`} onClick={cycleTheme} />
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Veri</div>
        <div className="card" style={{ padding: 0 }}>
          <div className="settings-item" onClick={handleExport}>
            <div>
              <div className="settings-item-text" style={{ fontSize: 15, fontWeight: 500 }}>Verileri Dışa Aktar</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>JSON olarak indir</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </div>
          <div className="settings-item" onClick={handleImport}>
            <div>
              <div className="settings-item-text" style={{ fontSize: 15, fontWeight: 500 }}>Verileri İçe Aktar</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>JSON dosyasından yükle</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Güvenlik</div>
        <div className="card" style={{ padding: 0 }}>
          <div className="settings-item" onClick={handleChangePin}>
            <div>
              <div className="settings-item-text" style={{ fontSize: 15, fontWeight: 500 }}>PIN Değiştir</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>6 haneli PIN</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Hesap</div>
        <div className="card" style={{ padding: 0 }}>
          <div className="settings-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <div>
              <div className="settings-item-text" style={{ fontSize: 15, fontWeight: 500, color: 'var(--danger)' }}>Çıkış Yap</div>
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>PIN tekrar gerekecek</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', padding: '24px 0' }}>
        Aile Kartı v1.0 · Supabase ile senkronize
      </div>
    </Layout>
  );
}
