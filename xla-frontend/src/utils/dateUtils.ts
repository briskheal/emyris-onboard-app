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

  // If YYYY-MM-DD or YYYY-DD-MM (e.g. "2026-09-02" or "2026-18-10")
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    const p1 = parseInt(parts[1], 10);
    if (p1 > 12) {
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
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

/**
 * Transforms any date input (Date object, MM-DD-YYYY, DD-MM-YYYY, YYYY-MM-DD)
 * into standard ISO YYYY-MM-DD for backend APIs and HTML5 inputs.
 */
export function formatStorageDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    const offset = dateInput.getTimezoneOffset() * 60000;
    return new Date(dateInput.getTime() - offset).toISOString().split('T')[0];
  }
  const str = String(dateInput).trim();
  if (!str || str === 'undefined' || str === 'null') return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-');
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (p1 > 12) {
      return `${parts[0]}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    return str;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const y = parts[2];
    const month = p1 > 12 ? p2 : p1;
    const day = p1 > 12 ? p1 : p2;
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().split('T')[0];
    }
  } catch (e) {}
  return str;
}

/**
 * Strictly returns YYYY-MM-DD for binding to HTML5 <input type="date">.
 */
export function toInputDateValue(dateStr: string | null | undefined): string {
  return formatStorageDate(dateStr);
}
