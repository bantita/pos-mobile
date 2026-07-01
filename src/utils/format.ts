export const formatCurrency = (amount: number): string =>
  amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNumber = (n: number): string =>
  n.toLocaleString('th-TH');

export const formatDate = (date: Date): string =>
  date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatTime = (date: Date): string =>
  date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

export const formatDateTime = (date: Date): string =>
  `${formatDate(date)} ${formatTime(date)}`;
