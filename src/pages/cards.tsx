import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { getState, setState } from '@/lib/store';
import { cardMask } from '@/lib/format';
import { Card } from '@/lib/types';

export default function CardsPage() {
  const { cards, persons } = getState();
  const [showModal, setShowModal] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [form, setForm] = useState({ name: '', person_id: '', last4: '', cutoff_day: '1' });

  async function handleSave() {
    if (!form.name.trim()) return;
    const fields = {
      name: form.name.trim(),
      person_id: form.person_id || null,
      last4: form.last4.replace(/\D/g, '').slice(-4),
      cutoff_day: parseInt(form.cutoff_day),
    };
    if (editCard) {
      const { data } = await supabase.from('cards').update(fields).eq('id', editCard.id).select('*, persons(name)').single();
      if (data) setState({ cards: cards.map(c => c.id === data.id ? data : c) });
    } else {
      const { data } = await supabase.from('cards').insert(fields).select('*, persons(name)').single();
      if (data) setState({ cards: [...cards, data] });
    }
    closeModal();
    (window as any).showToast?.(editCard ? 'Güncellendi' : 'Kart eklendi');
  }

  async function handleDelete(c: Card) {
    if (!confirm(`${c.name} silinecek?`)) return;
    await supabase.from('cards').delete().eq('id', c.id);
    setState({ cards: cards.filter(x => x.id !== c.id) });
    (window as any).showToast?.('Silindi');
  }

  function openAdd() {
    setEditCard(null);
    setForm({ name: '', person_id: '', last4: '', cutoff_day: '1' });
    setShowModal(true);
  }

  function openEdit(c: Card) {
    setEditCard(c);
    setForm({ name: c.name, person_id: c.person_id || '', last4: c.last4 || '', cutoff_day: String(c.cutoff_day) });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditCard(null);
  }

  return (
    <Layout title="Kartlar">
      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <div className="empty-state-title">Henüz kart yok</div>
          <div className="empty-state-text">İlk kartını ekle</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 4px' }}>
          {cards.map((c, i) => (
            <div key={c.id} className="list-item">
              <div className="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div className="text-xs text-secondary">
                  {(c as any).persons?.name || '—'} · {cardMask(c.last4)} · Kesim: {c.cutoff_day}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => openEdit(c)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(c)} style={{ color: 'var(--danger)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-full mt-6" onClick={openAdd}>
        + Kart Ekle
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editCard ? 'Kart Düzenle' : 'Yeni Kart'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Kart Adı</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="örn. Garanti Gold" maxLength={40} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Sahibi</label>
              <select className="form-select" value={form.person_id} onChange={e => setForm(f => ({ ...f, person_id: e.target.value }))}>
                <option value="">Kişi seç...</option>
                {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Son 4 Hane</label>
              <input className="form-input mono" value={form.last4} onChange={e => setForm(f => ({ ...f, last4: e.target.value.replace(/\D/g,'').slice(0,4) }))} placeholder="1234" maxLength={4} inputMode="numeric" />
            </div>
            <div className="form-group">
              <label className="form-label">Hesap Kesim Günü</label>
              <select className="form-select" value={form.cutoff_day} onChange={e => setForm(f => ({ ...f, cutoff_day: e.target.value }))}>
                {Array.from({length: 31}, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
