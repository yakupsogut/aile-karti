import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { getState, setState } from '@/lib/store';
import { buildInstallments } from '@/lib/calc';
import { money } from '@/lib/format';

export default function AddExpense() {
  const router = useRouter();
  const { cards, persons, expenses } = getState();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    card_id: '',
    assigned_to: '',
    description: '',
    amount: '',
    installments: '1',
    date: new Date().toISOString().slice(0, 10),
  });
  const [touched, setTouched] = useState(false);

  const amount = parseFloat(form.amount) || 0;
  const inst = parseInt(form.installments) || 1;
  const perMonth = inst > 0 ? amount / inst : 0;
  const hasError = touched && (!form.card_id || !form.assigned_to || !amount);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setTouched(true);
  }

  async function handleSubmit() {
    setTouched(true);
    if (!form.card_id || !form.assigned_to || !amount) {
      (window as any).showToast?.('Kart, kişi ve tutar zorunludur');
      return;
    }
    setLoading(true);

    const { data: expense, error: expError } = await supabase
      .from('expenses')
      .insert({
        card_id: form.card_id,
        assigned_to: form.assigned_to,
        description: form.description.trim(),
        amount,
        installments: inst,
        date: form.date,
      })
      .select()
      .single();

    if (expError || !expense) {
      (window as any).showToast?.('Hata: ' + (expError?.message || 'bilinmeyen'));
      setLoading(false);
      return;
    }

    // Build installments
    const card = cards.find(c => c.id === form.card_id);
    const cutoff = card?.cutoff_day || 1;
    const insts = buildInstallments(amount, inst, form.date, cutoff);
    const installmentRows = insts.map((inst: any) => ({
      expense_id: expense.id,
      amount: inst.amount,
      due_month: inst.due_month,
      due_year: inst.due_year,
      paid: false,
    }));

    await supabase.from('installments').insert(installmentRows);
    setState({ expenses: [expense, ...expenses] });
    (window as any).showToast?.('Harcama kaydedildi!');
    router.push('/dashboard');
    setLoading(false);
  }

  return (
    <Layout title="Harcama Ekle">
      <div className="card">
        <div className="form-group">
          <label className="form-label">Kart *</label>
          <select
            className={`form-select${hasError && !form.card_id ? ' error' : ''}`}
            value={form.card_id}
            onChange={e => set('card_id', e.target.value)}
          >
            <option value="">Kart seç...</option>
            {cards.map(c => <option key={c.id} value={c.id}>{c.name} {c.last4 ? '('+c.last4+')' : ''}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Kime Atandı *</label>
          <select
            className={`form-select${hasError && !form.assigned_to ? ' error' : ''}`}
            value={form.assigned_to}
            onChange={e => set('assigned_to', e.target.value)}
          >
            <option value="">Kişi seç...</option>
            {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Açıklama</label>
          <input
            className="form-input"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="örn. Market alışverişi"
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tutar (₺) *</label>
          <input
            className={`form-input mono${hasError && !amount ? ' error' : ''}`}
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Taksit</label>
          <select className="form-select" value={form.installments} onChange={e => set('installments', e.target.value)}>
            {Array.from({length: 24}, (_, i) => <option key={i+1} value={i+1}>{i+1} taksit{i === 0 ? ' (tek çekim)' : ''}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tarih</label>
          <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>

        {amount > 0 && (
          <div className={`installment-preview${inst > 3 ? ' error' : ''}`}>
            {inst === 1
              ? <>Tek çekim: <strong>{money(amount)}</strong></>
              : <>
                Bu ay: <strong>{money(perMonth)}</strong>
                {inst > 1 && <> · {inst - 1} ay daha: <strong>{money(perMonth)}</strong></>}
                {inst > 3 && <> · ⚠️ {inst} taksit uzun vadeli</>}
              </>
            }
          </div>
        )}

        <button
          className="btn btn-primary btn-full mt-4"
          onClick={handleSubmit}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              Kaydediliyor...
            </span>
          ) : 'Harcama Kaydet'}
        </button>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}
