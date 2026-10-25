import { dateString, requireValue } from './errors.ts';

export function validateTimezone(value) {
  requireValue(typeof value === 'string' && value.length < 100, 'Choose a valid IANA timezone.');
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
  } catch {
    requireValue(false, 'Choose a valid IANA timezone.');
  }
  return value;
}
export function localDate(timezone, date = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (name) => p.find((x) => x.type === name)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function shiftDate(date, days) {
  const d = new Date(dateString(date) + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function previousDay(date, working = false) {
  let result = shiftDate(date, -1);
  while (working && [0, 6].includes(new Date(result + 'T12:00:00Z').getUTCDay()))
    result = shiftDate(result, -1);
  return result;
}
export function workDate(date, preferences) {
  return previousDay(date, preferences.activityWindow === 'previous-working-day');
}
export function monday(date) {
  const weekday = new Date(dateString(date) + 'T12:00:00Z').getUTCDay();
  return shiftDate(date, -(weekday === 0 ? 6 : weekday - 1));
}
