// lib/exportUtils.js
import * as XLSX from 'xlsx';

/**
 * Download data as CSV.
 * @param {Array<Object>} rows
 * @param {string} filename
 */
export function exportToCsv(rows = [], filename = 'export.csv') {
  if (!Array.isArray(rows)) rows = Array.from(rows || []);
  if (!rows.length) {
    // create empty CSV
    const blob = new Blob([''], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    downloadUrl(url, filename);
    URL.revokeObjectURL(url);
    return;
  }

  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map(r =>
      keys
        .map(k => {
          let v = r[k] == null ? '' : String(r[k]);
          // escape quotes & commas/newlines
          v = v.replace(/"/g, '""');
          if (v.includes(',') || v.includes('\n') || v.includes('"')) v = `"${v}"`;
          return v;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  URL.revokeObjectURL(url);
}

function downloadUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Export rows to XLSX (SheetJS)
 * @param {Array<Object>} rows
 * @param {string} filename
 */
export function exportToXlsx(rows = [], filename = 'export.xlsx') {
  // fallback to CSV if XLSX not present
  if (!Array.isArray(rows)) rows = Array.from(rows || []);
  try {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);
  } catch (err) {
    console.error('XLSX export failed', err);
    // as fallback, call CSV export
    exportToCsv(rows, filename.replace(/\.xlsx?$/, '.csv'));
  }
}
