import { Card, Expense, Person, Installment, Summary } from './types';

export function currentBillingPeriod(cutoffDay: number): { month: number; year: number } {
  const now = new Date();
  const today = now.getDate();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  if (today <= cutoffDay) {
    const m = curMonth - 1;
    return { month: m < 0 ? 11 : m, year: m < 0 ? curYear - 1 : curYear };
  }
  return { month: curMonth, year: curYear };
}

export function buildInstallments(
  amount: number,
  installments: number,
  date: string,
  cutoffDay: number
): { amount: number; due_month: number; due_year: number }[] {
  if (!amount || !installments) return [];
  const d = new Date(date);
  const startMonth = d.getMonth();
  const startYear = d.getFullYear();
  const installmentAmount = Math.round((amount / installments) * 100) / 100;
  return Array.from({ length: installments }, (_, i) => {
    let m = startMonth + i;
    let y = startYear + Math.floor(m / 12);
    m = m % 12;
    if (m < 0) m += 12;
    return { amount: installmentAmount, due_month: m, due_year: y };
  });
}

export function summarize(
  expenses: Expense[],
  cards: Card[],
  persons: Person[],
  installments: Installment[]
): Summary {
  const now = new Date();
  const instByExpense: Record<string, Installment[]> = {};
  installments.forEach((i) => {
    if (!instByExpense[i.expense_id]) instByExpense[i.expense_id] = [];
    instByExpense[i.expense_id].push(i);
  });

  const cardCutoff: Record<string, number> = {};
  cards.forEach((c) => { cardCutoff[c.id] = c.cutoff_day || 1; });

  let thisMonthTotal = 0;
  let futureMonthsTotal = 0;
  const byPerson: Record<string, number> = {};
  const byCard: Record<string, number> = {};
  persons.forEach((p) => { byPerson[p.id] = 0; });

  expenses.forEach((exp) => {
    const cutoff = cardCutoff[exp.card_id] || 1;
    const { month: curMonth, year: curYear } = currentBillingPeriod(cutoff);
    const insts = instByExpense[exp.id] || buildInstallments(exp.amount, exp.installments, exp.date, cutoff);

    insts.forEach((inst) => {
      const isCurrent = inst.due_month === curMonth && inst.due_year === curYear;
      const isFuture = inst.due_year > curYear ||
        (inst.due_year === curYear && inst.due_month > curMonth);

      if (isCurrent && !inst.paid) {
        thisMonthTotal += inst.amount;
        byPerson[exp.assigned_to] = (byPerson[exp.assigned_to] || 0) + inst.amount;
        byCard[exp.card_id] = (byCard[exp.card_id] || 0) + inst.amount;
      }
      if (isFuture && !inst.paid) {
        futureMonthsTotal += inst.amount;
      }
    });
  });

  const recent = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return { thisMonthTotal, futureMonthsTotal, byPerson, byCard, recent };
}
