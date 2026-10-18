/**
 * Universal Enterprise Date Standard (Backend)
 * Principle: Persist ISO (YYYY-MM-DD), Display Localized (MM-DD-YYYY)
 */

function toStorageDate(input) {
    if (!input) return null;
    let str = String(input).trim();
    if (!str || str === 'undefined' || str === 'null') return null;

    // Convert slashes or dots to hyphens
    str = str.replace(/[./]/g, '-');

    // If starts with YYYY-MM-DD or YYYY-DD-MM (e.g. 2026-10-18 or 2026-10-18T12:00:00Z)
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
        const parts = str.substring(0, 10).split('-');
        const y = parts[0];
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (p1 > 12) {
            // YYYY-DD-MM -> YYYY-MM-DD
            return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
        }
        return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
    }

    // If MM-DD-YYYY or DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
        const parts = str.split('-');
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const y = parts[2];
        // Standard is MM-DD-YYYY. If first number > 12, it must be DD-MM-YYYY
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

    return null;
}

function toDisplayDate(storageDate) {
    if (!storageDate) return '-';
    let str = String(storageDate).trim();
    if (!str || str === 'undefined' || str === 'null') return '-';

    str = str.replace(/[./]/g, '-');

    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
        const parts = str.substring(0, 10).split('-');
        const y = parts[0];
        const m = String(parseInt(parts[1], 10)).padStart(2, '0');
        const d = String(parseInt(parts[2], 10)).padStart(2, '0');
        return `${m}-${d}-${y}`;
    }

    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
        const parts = str.split('-');
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const y = parts[2];
        const m = p1 > 12 ? p2 : p1;
        const d = p1 > 12 ? p1 : p2;
        return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}-${y}`;
    }

    return str;
}

function getMonthYear(storageDate) {
    const sDate = toStorageDate(storageDate);
    if (!sDate) return { month: '', year: '' };
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const parts = sDate.split('-');
    const mIdx = parseInt(parts[1], 10) - 1;
    return {
        month: months[mIdx] || '',
        year: parts[0]
    };
}

module.exports = { toStorageDate, toDisplayDate, getMonthYear };
