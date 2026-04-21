import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { getState, setState } from '@/lib/store';
import { money, cardMask } from '@/lib/format';
import { Expense } from '@/lib/types';

export default function HistoryPage() {
  const { expenses, cards, persons } = getState();
  const [filterCard, setFilterCard] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  let list = [...expenses];
  if (filterCard) list = list.filter(e => e.card_id === filterCard);
  if (filterPerson) list = list.filter(e => e.assigned_to === filterPerson);

  async function handleDelete(e: Expense) {
    if (deletingId) return;
    setDeletingId(e.id);
    try {
      await supabase.from('installments').delete().eq('expense_id', e.id);
      await supabase.from('expenses').delete().eq('id', e.id);
      setState({ expenses: expenses.filter(x => x.id !== e.id) });
      (window as any).showToast?.('Silindi');
    } finally {
      setDeletingId(null);
    }
  }

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*, cards(name,last4,cutoff_day,persons(name)), persons(name)').order('date', { ascending: false });
    if (data) setState({ expenses: data });
    setLoading(false);
  }

  return (
    <Layout title="Geçmiş" actions={
      <button className="btn btn-ghost btn-icon" onClick={refresh} disabled={loading}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={loading ? { animation: 'spin 1s linear infinite' } : {}}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
      </button>
    }>
      <div className="history-filters">
        <button className={`filter-chip${!filterCard && !filterPerson ? ' active' : ''}`} onClick={() => { setFilterCard(''); setFilterPerson(''); }}>
          Tümü
        </button>
        {cards.map(c => (
          <button key={c.id} className={`filter-chip${filterCard === c.id ? ' active' : ''}`} onClick={() => { setFilterCard(filterCard === c.id ? '' : c.id); setFilterPerson(''); }}>
            {c.name}
          </button>
        ))}
        <span className="filter-divider" />
        {persons.map(p => (
          <button key={p.id} className={`filter-chip${filterPerson === p.id ? ' active' : ''}`} onClick={() => { setFilterPerson(filterPerson === p.id ? '' : p.id); setFilterCard(''); }}>
            {p.name}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Harcama yok</div>
          <div className="empty-state-text">Filtreleri temizle veya harcama ekle</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 4px' }}>
          {list.map((e, i) => (
            <div key={e.id}>
              <div className="history-item" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || 'İsimsiz harcama'}</div>
                  <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                    {new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    {' · '}{cardMask((e as any).cards?.last4)}
                    {(e as any).persons ? ' · ' + (e as any).persons.name : ''}
                  </div>
                  {expanded === e.id && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {(e as any).cards?.name && <div>Kart: {(e as any).cards.name}</div>}
                      <div>Tarih: {new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  )}
                </div>
                <div className="history-actions">
                  <div className="history-item-amount">{money(e.amount)}</div>
                  {e.installments > 1 && <div className="text-xs text-secondary">×{e.installments} taksit</div>}
                  <button
                    className="history-delete-btn"
                    onClick={(ev) => { ev.stopPropagation(); handleDelete(e); }}
                    disabled={deletingId === e.id}
                  >
                    {deletingId === e.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6M12 18v0"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    )}
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>Yükleniyor...</div>}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}
