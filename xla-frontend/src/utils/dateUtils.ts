/**
 * Universal Presentation Date Standard: DD-MM-YYYY
 * Storage Date Standard: YYYY-MM-DD
 */

/**
 * Formats any date string or Date object into DD-MM-YYYY presentation format.
 * Examples:
 *   "2026-10-18" -> "18-10-2026"
 *   "2026-09-02" -> "02-09-2026"
 *   "18-10-2026" -> "18-10-2026"
 */
export function formatDDMMYYYY(dStr: string | null | undefined): string {
  if (!dStr) return '-';
  const str = String(dStr).trim();
  if (!str || str === 'undefined' || str === 'null') return '-';

  // If YYYY-MM-DD or YYYY-DD-MM (e.g. "2026-10-18")
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    const y = parts[0];
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    const m = p1 > 12 ? p2 : p1;
    const d = p1 > 12 ? p1 : p2;
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
  }

  // If DD-MM-YYYY or MM-DD-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const y = parts[2];
    const d = p2 > 12 ? p2 : p1;
    const m = p2 > 12 ? p1 : p2;
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
  }

  // If ISO or parsable Date string
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
  } catch (e) {}

  return str;
}

// Backward-compatible alias so all existing component imports render DD-MM-YYYY
export const formatMMDDYYYY = formatDDMMYYYY;

/**
 * Transforms any date input (Date object, DD-MM-YYYY, MM-DD-YYYY, YYYY-MM-DD)
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

  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    const y = parts[0];
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    if (p1 > 12) {
      return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
  }

  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const y = parts[2];
    const day = p2 > 12 ? p2 : p1;
    const month = p2 > 12 ? p1 : p2;
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

/**
 * Generates an array of years dynamically anchored around the current calendar year.
 * e.g. for 2026 with past=2, future=2: ['2024', '2025', '2026', '2027', '2028']
 * When calendar rolls to 2027: ['2025', '2026', '2027', '2028', '2029']
 */
export function getDynamicYears(pastYears = 2, futureYears = 2): string[] {
  const current = new Date().getFullYear();
  const years: string[] = [];
  for (let y = current - pastYears; y <= current + futureYears; y++) {
    years.push(String(y));
  }
  return years;
}

/**
 * Generates financial years dynamically based on current date.
 * (April 1st roll-over for Indian Financial Year)
 * e.g. ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029']
 */
export function getDynamicFinancialYears(pastCount = 2, futureCount = 2): string[] {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const list: string[] = [];
  for (let i = -pastCount; i <= futureCount; i++) {
    const y = startYear + i;
    list.push(`${y}-${y + 1}`);
  }
  return list;
}

export function getCurrentFinancialYear(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

