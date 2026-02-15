export function getToday() {
  return formatDateKey(new Date());
}

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(dateKey1, dateKey2) {
  return dateKey1 === dateKey2;
}

export function getWeekRange() {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(formatDateKey(d));
  }
  return days;
}

export function getDayLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (formatDateKey(date) === formatDateKey(today)) return 'Today';
  if (formatDateKey(date) === formatDateKey(yesterday)) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
