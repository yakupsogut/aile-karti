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

  let list = [...expenses];
  if (filterCard) list = list.filter(e => e.card_id === filterCard);
  if (filterPerson) list = list.filter(e => e.assigned_to === filterPerson);

  async function handleDelete(e: Expense) {
    if (!confirm('Harcama silinecek? Taksitler de silinir.')) return;
    await supabase.from('installments').delete().eq('expense_id', e.id);
    await supabase.from('expenses').delete().eq('id', e.id);
    setState({ expenses: expenses.filter(x => x.id !== e.id) });
    (window as any).showToast?.('Silindi');
  }

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*, cards(name,last4,cutoff_day,persons(name)), persons(name)').order('date', { ascending: false });
    if (data) setState({ expenses: data });
    setLoading(false);
  }

  return (
    <Layout title="Geçmiş">
      <div className="history-filters">
        <button className={`filter-chip${!filterCard && !filterPerson ? ' active' : ''}`} onClick={() => { setFilterCard(''); setFilterPerson(''); }}>
          Tümü
        </button>
        {cards.map(c => (
          <button key={c.id} className={`filter-chip${filterCard === c.id ? ' active' : ''}`} onClick={() => { setFilterCard(filterCard === c.id ? '' : c.id); setFilterPerson(''); }}>
            {c.name}
          </button>
        ))}
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.description || 'İsimsiz harcama'}</div>
                  <div className="text-xs text-secondary">
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
                <div style={{ textAlign: 'right' }}>
                  <div className="history-item-amount">{money(e.amount)}</div>
                  {e.installments > 1 && <div className="text-xs text-secondary">×{e.installments} taksit</div>}
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11, color: 'var(--danger)', padding: '2px 0' }}
                    onClick={(ev) => { ev.stopPropagation(); handleDelete(e); }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>Yükleniyor...</div>}
    </Layout>
  );
}
