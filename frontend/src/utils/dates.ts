export const shortDate = (value: string) =>
  new Date(value + 'T12:00:00Z').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
export function monday(value: string) {
  const date = new Date(value + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() || 7) + 1);
  return date.toISOString().slice(0, 10);
}
