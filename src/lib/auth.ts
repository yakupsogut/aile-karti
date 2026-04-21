const PIN_KEY = 'ak_pin_hash';
const ATTEMPTS_KEY = 'ak_pin_attempts';
const MAX_ATTEMPTS = 3;

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function hashPin(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) + h) + pin.charCodeAt(i);
    h = h & h;
  }
  return 'pin_' + Math.abs(h).toString(36);
}

export const auth = {
  isPinSet(): boolean {
    return isClient() ? !!localStorage.getItem(PIN_KEY) : false;
  },

  setPin(pin: string): void {
    localStorage.setItem(PIN_KEY, hashPin(pin));
    localStorage.setItem(ATTEMPTS_KEY, '0');
  },

  verifyPin(pin: string): boolean {
    const stored = localStorage.getItem(PIN_KEY);
    if (hashPin(pin) === stored) {
      localStorage.setItem(ATTEMPTS_KEY, '0');
      return true;
    }
    const attempts = this.getAttempts() + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));
    return false;
  },

  getAttempts(): number {
    return parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0');
  },

  isLocked(): boolean {
    return this.getAttempts() >= MAX_ATTEMPTS;
  },

  resetPin(): void {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  },
};
