/**
 * Date Utilities for XL User Portal
 */

export function getDynamicYears(pastYears = 2, futureYears = 2): string[] {
  const current = new Date().getFullYear();
  const years: string[] = [];
  for (let y = current - pastYears; y <= current + futureYears; y++) {
    years.push(String(y));
  }
  return years;
}

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
