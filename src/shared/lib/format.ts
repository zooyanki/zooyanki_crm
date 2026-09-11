export function formatPrice(price: number | null | undefined, currency = 'RUB'): string {
  if (price === null || price === undefined) {
    return '—';
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
