import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { getState, setState } from '@/lib/store';
import { initials } from '@/lib/format';
import { Person } from '@/lib/types';

const COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];

export default function PersonsPage() {
  const { persons } = getState();
  const [showModal, setShowModal] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [name, setName] = useState('');

  async function handleSave() {
    if (!name.trim()) return;
    if (editPerson) {
      const { data } = await supabase.from('persons').update({ name: name.trim() }).eq('id', editPerson.id).select().single();
      if (data) {
        setState({ persons: persons.map(p => p.id === data.id ? data : p) });
      }
    } else {
      const color = COLORS[persons.length % COLORS.length];
      const { data } = await supabase.from('persons').insert({ name: name.trim(), color }).select().single();
      if (data) setState({ persons: [...persons, data] });
    }
    closeModal();
    (window as any).showToast?.(editPerson ? 'Güncellendi' : 'Kişi eklendi');
  }

  async function handleDelete(p: Person) {
    if (!confirm(`${p.name} silinecek?`)) return;
    await supabase.from('persons').delete().eq('id', p.id);
    setState({ persons: persons.filter(x => x.id !== p.id) });
    (window as any).showToast?.('Silindi');
  }

  function openAdd() {
    setEditPerson(null);
    setName('');
    setShowModal(true);
  }

  function openEdit(p: Person) {
    setEditPerson(p);
    setName(p.name);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditPerson(null);
    setName('');
  }

  return (
    <Layout title="Kişiler">
      {persons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">Henüz kişi yok</div>
          <div className="empty-state-text">Aile üyesi veya arkadaş ekle</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 4px' }}>
          {persons.map((p, i) => (
            <div key={p.id} className="list-item">
              <div className="person-avatar" style={{ background: p.color || COLORS[i % COLORS.length], width: 40, height: 40, fontSize: 14 }}>
                {initials(p.name)}
              </div>
              <div style={{ flex: 1, fontWeight: 600 }}>{p.name}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => openEdit(p)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(p)} style={{ color: 'var(--danger)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary btn-full mt-6" onClick={openAdd}>
        + Kişi Ekle
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editPerson ? 'Kişi Düzenle' : 'Yeni Kişi'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">İsim</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="örn. Yakup"
                maxLength={40}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
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
