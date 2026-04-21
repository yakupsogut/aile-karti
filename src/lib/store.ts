import { Person, Card, Expense, Installment, Summary } from './types';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  persons: Person[];
  cards: Card[];
  expenses: Expense[];
  installments: Installment[];
  summary: Summary | null;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('ak_theme') as Theme) || 'system';
}

let _state: AppState = {
  theme: 'system',
  persons: [],
  cards: [],
  expenses: [],
  installments: [],
  summary: null,
};

const _listeners = new Set<(s: AppState) => void>();

export function getState(): AppState {
  return _state;
}

export function setState(partial: Partial<AppState>): void {
  const prev = _state;
  _state = { ..._state, ...partial };
  _listeners.forEach((fn: (s: AppState, prev: AppState) => void) => fn(_state, prev));
}

export function subscribe(fn: (s: AppState) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.removeAttribute('data-theme');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }
}

export function setTheme(theme: Theme): void {
  localStorage.setItem('ak_theme', theme);
  setState({ theme });
  applyTheme(theme);
}

// Init theme (client only)
if (typeof window !== 'undefined') {
  applyTheme(_state.theme);
}
