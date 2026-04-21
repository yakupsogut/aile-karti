import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import { getState, setTheme, getState as gs, applyTheme } from '@/lib/store';
import { auth } from '@/lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setThemeState(getState().theme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const nextTheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : (
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );
    applyTheme(nextTheme);
  }, [theme, mounted]);

  function cycleTheme() {
    const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
    setTheme(next);
    setThemeState(next);
  }

  function cycleLabel() {
    if (theme === 'system') return 'Sistem tercihi';
    if (theme === 'dark') return 'Koyu';
    return 'Açık';
  }

  const handleExport = useCallback(async () => {
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
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        JSON.parse(text);
        (window as any).showToast?.('İçe aktarma yakında aktif olacak');
      } catch {
        (window as any).showToast?.('Geçersiz JSON dosyası');
      }
    };
    input.click();
  }, []);

  const handleLogout = useCallback(() => {
    if (confirm('Çıkış yapılacak. PIN tekrar gerekecek.')) {
      router.push('/login');
    }
  }, [router]);

  const handleChangePin = useCallback(() => {
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
  }, []);

  const isDark = mounted
    ? (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
    : false;

  return (
    <Layout title="Ayarlar" showTabs={false}>
      <div className="settings-group">
        <div className="settings-group-title">Görünüm</div>
        <div className="card settings-card">
          <button className="settings-item settings-item-btn" onClick={cycleTheme}>
            <div className="settings-item-left">
              <span className="settings-item-icon">
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" x2="12" y1="1" y2="3"/><line x1="12" x2="12" y1="21" y2="23"/><line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/><line x1="1" x2="3" y1="12" y2="12"/><line x1="21" x2="23" y1="12" y2="12"/><line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/><line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/></svg>
                )}
              </span>
              <div>
                <div className="settings-item-text">Koyu Tema</div>
                <div className="settings-item-desc">{mounted ? cycleLabel() : 'Yükleniyor...'}</div>
              </div>
            </div>
            <div className={`toggle-switch${isDark ? ' on' : ''}`} />
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Veri</div>
        <div className="card settings-card">
          <button className="settings-item settings-item-btn" onClick={handleExport}>
            <div className="settings-item-left">
              <span className="settings-item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              </span>
              <div>
                <div className="settings-item-text">Verileri Dışa Aktar</div>
                <div className="settings-item-desc">JSON olarak indir</div>
              </div>
            </div>
            <svg className="settings-item-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button className="settings-item settings-item-btn" onClick={handleImport}>
            <div className="settings-item-left">
              <span className="settings-item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </span>
              <div>
                <div className="settings-item-text">Verileri İçe Aktar</div>
                <div className="settings-item-desc">JSON dosyasından yükle</div>
              </div>
            </div>
            <svg className="settings-item-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Güvenlik</div>
        <div className="card settings-card">
          <button className="settings-item settings-item-btn" onClick={handleChangePin}>
            <div className="settings-item-left">
              <span className="settings-item-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <div>
                <div className="settings-item-text">PIN Değiştir</div>
                <div className="settings-item-desc">6 haneli PIN</div>
              </div>
            </div>
            <svg className="settings-item-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Hesap</div>
        <div className="card settings-card settings-card-danger">
          <button className="settings-item settings-item-btn settings-item-danger" onClick={handleLogout}>
            <div className="settings-item-left">
              <span className="settings-item-icon settings-item-icon-danger">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </span>
              <div>
                <div className="settings-item-text settings-item-text-danger">Çıkış Yap</div>
                <div className="settings-item-desc">PIN tekrar gerekecek</div>
              </div>
            </div>
            <svg className="settings-item-arrow settings-item-arrow-danger" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div className="settings-footer">
        Aile Kartı v1.0 · Supabase ile senkronize
      </div>
    </Layout>
  );
}
