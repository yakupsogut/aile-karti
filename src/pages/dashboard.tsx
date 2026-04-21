import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { getState, setState } from '@/lib/store';
import { summarize, buildInstallments } from '@/lib/calc';
import { money, initials, cardMask } from '@/lib/format';
import { Person, Card, Expense, Installment } from '@/lib/types';

const PERSON_COLORS = [
  '#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6',
  '#EC4899','#14B8A6','#F97316','#06B6D4','#84CC16'
];

function getColor(index: number) {
  return PERSON_COLORS[index % PERSON_COLORS.length];
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const { persons, cards, expenses, summary } = getState();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [personsData, cardsData, expensesData] = await Promise.all([
      supabase.from('persons').select('*').order('created_at'),
      supabase.from('cards').select('*, persons(name)').order('created_at'),
      supabase.from('expenses').select('*, cards(name,last4,cutoff_day,persons(name)), persons(name)').order('date', { ascending: false }),
    ]);

    let instData: { data: Installment[] } = { data: [] };
    try {
      const r = await supabase.from('installments').select('*');
      instData = { data: r.data || [] };
    } catch { instData = { data: [] }; }

    const persons = personsData.data || [];
    const cards = cardsData.data || [];
    const expenses = expensesData.data || [];
    const installments = instData.data || [];

    const expenseIds = new Set(installments.map(i => i.expense_id));
    const missing = expenses.filter(e => !expenseIds.has(e.id));
    if (missing.length > 0) {
      const toInsert: any[] = [];
      missing.forEach(exp => {
        const card = cards.find((c: any) => c.id === exp.card_id);
        const cutoff = card?.cutoff_day || 1;
        const insts = buildInstallments(exp.amount, exp.installments, exp.date, cutoff);
        insts.forEach((inst: any) => {
          toInsert.push({
            expense_id: exp.id,
            amount: inst.amount,
            due_month: inst.due_month,
            due_year: inst.due_year,
            paid: false,
          });
        });
      });
      if (toInsert.length > 0) {
        await supabase.from('installments').insert(toInsert);
      }
    }

    setState({ persons, cards, expenses, installments });
    const summary = summarize(expenses, cards, persons, installments);
    setState({ summary });
    setLoading(false);
  }

  if (loading) {
    return (
      <Layout title="Aile Kartı" showTabs={false}>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)', fontSize: 14 }}>
          Yükleniyor...
        </div>
      </Layout>
    );
  }

  const { thisMonthTotal, futureMonthsTotal, byPerson, byCard, recent } = summary || {
    thisMonthTotal: 0, futureMonthsTotal: 0, byPerson: {}, byCard: {}, recent: [],
  };

  return (
    <Layout title="Aile Kartı">
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card full">
          <div className="stat-label">Bu Ayın Ödemesi</div>
          <div className="stat-value accent" style={{ fontSize: 26 }}>{money(thisMonthTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gelecek Aylar</div>
          <div className="stat-value warning">{money(futureMonthsTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Toplam Kişi</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{persons.length}</div>
        </div>
      </div>

      {/* Person breakdown */}
      {persons.length > 0 && (
        <>
          <div className="section-title">Kişi Bazlı (Bu Ay)</div>
          <div className="card" style={{ padding: 0 }}>
            {persons.map((p, i) => {
              const amount = byPerson[p.id] || 0;
              return (
                <div key={p.id} className="list-item" style={{ padding: '14px 18px' }}>
                  <div className="person-avatar" style={{ background: getColor(i) }}>
                    {initials(p.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: amount > 0 ? 'var(--text-secondary)' : 'var(--success)', marginTop: 2 }}>
                      {amount > 0 ? 'Ödenecek' : 'Borç yok'}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
                    color: amount > 0 ? 'var(--warning)' : 'var(--success)',
                  }}>
                    {money(amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Card breakdown */}
      {cards.length > 0 && (
        <>
          <div className="section-title">Kart Bazlı (Bu Ay)</div>
          <div className="card" style={{ padding: 0 }}>
            {cards.map((c, i) => {
              const amount = byCard[c.id] || 0;
              return (
                <div key={c.id} className="list-item" style={{ padding: '14px 18px' }}>
                  <div className="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {cardMask(c.last4)} · Kesim: {c.cutoff_day}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15,
                    color: amount > 0 ? 'var(--warning)' : 'var(--success)',
                  }}>
                    {money(amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recent */}
      <div className="section-title">Son Harcamalar</div>
      {recent.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Henüz harcama yok</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>İlk harcamanı ekle!</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 4px' }}>
          {recent.map((e) => (
            <div key={e.id} className="history-item">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.description || 'İsimsiz harcama'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  {' · '}{e.persons?.name || '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>
                  {money(e.amount)}
                </div>
                {e.installments > 1 && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    ×{e.installments} taksit
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
