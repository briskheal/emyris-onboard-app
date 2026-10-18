/**
 * Formats any date string or Date object into MM-DD-YYYY format.
 * Examples:
 *   "2026-08-02" -> "08-02-2026"
 *   "2026-09-02" -> "09-02-2026"
 *   "09-02-2026" -> "09-02-2026"
 */
export function formatMMDDYYYY(dStr: string | null | undefined): string {
  if (!dStr) return '-';
  const str = String(dStr).trim();
  if (!str || str === 'undefined' || str === 'null') return '-';

  // If YYYY-MM-DD (e.g. "2026-09-02" or "2026-08-02T00:00:00.000Z")
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    return `${parts[1]}-${parts[2]}-${parts[0]}`;
  }

  // If DD-MM-YYYY or MM-DD-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    const p1 = parseInt(parts[0], 10);
    // If first number > 12, it is definitely a day (DD-MM-YYYY)
    if (p1 > 12) {
      return `${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}-${parts[2]}`;
    }
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  }

  // If ISO or parsable Date string
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}-${dd}-${yyyy}`;
    }
  } catch (e) {}

  return str;
}
