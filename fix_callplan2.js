const fs = require('fs');
let c = fs.readFileSync('xla-frontend/src/pages/CallPlan.tsx', 'utf8');

const strToRemove = `function formatDDMMYYYY(dateStr: string) {
  if (!dateStr) return '-';
  if (/^\\d{1,2}-\\d{1,2}-\\d{4}$/.test(dateStr)) return dateStr;
  if (/^\\d{4}-\\d{1,2}-\\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('T')[0].split('-');
      return parts[2].padStart(2, '0') + '-' + parts[1].padStart(2, '0') + '-' + parts[0];
  }
  try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
          return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
      }
  } catch (e) {}
  return dateStr;
}`;

c = c.replace(strToRemove, '');
fs.writeFileSync('xla-frontend/src/pages/CallPlan.tsx', c);
