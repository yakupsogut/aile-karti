export interface Person {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Card {
  id: string;
  person_id: string | null;
  name: string;
  last4: string;
  cutoff_day: number;
  created_at: string;
  persons?: { name: string };
}

export interface Expense {
  id: string;
  card_id: string;
  assigned_to: string;
  description: string;
  amount: number;
  installments: number;
  date: string;
  created_at: string;
  cards?: { name: string; last4: string; cutoff_day: number };
  persons?: { name: string };
}

export interface Installment {
  id: string;
  expense_id: string;
  amount: number;
  due_month: number;
  due_year: number;
  paid: boolean;
  paid_to: string | null;
  created_at: string;
}

export interface Summary {
  thisMonthTotal: number;
  futureMonthsTotal: number;
  byPerson: Record<string, number>;
  byCard: Record<string, number>;
  recent: Expense[];
}
