export class AppError extends Error {
  status: number;
  code: string;
  constructor(status, message, code = 'REQUEST_FAILED') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function requireValue(condition, message, status = 400) {
  if (!condition) throw new AppError(status, message);
}
export function shortText(value, label, max = 200) {
  requireValue(
    typeof value === 'string' && value.trim().length > 0 && value.length <= max,
    `${label} must contain 1–${max} characters.`,
  );
  return value.trim();
}
export function dateString(value) {
  requireValue(
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Use a date in YYYY-MM-DD format.',
  );
  const date = new Date(value + 'T12:00:00Z');
  requireValue(
    !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value,
    'That calendar date does not exist.',
  );
  return value;
}
