export function money(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0,00 ₺';
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

export function moneyRaw(n: number): string {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function monthName(n: number): string {
  return ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][n];
}

export function dateShort(d: string | null | undefined): string {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function initials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function cardMask(last4: string): string {
  if (!last4) return '•••• ••••';
  return '•••• ' + last4;
}
