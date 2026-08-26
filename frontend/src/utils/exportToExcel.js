/**
 * exportToExcel.js — Excel Compatible CSV Export Helper
 * ======================================================
 * Downloads clean CSV files that open directly in Microsoft Excel.
 * Includes UTF-8 Byte Order Mark (\uFEFF) to ensure character encoding.
 */

export function downloadCsvForExcel(filename, headers, rows) {
  if (!rows || !headers) return;

  const formattedRows = rows.map((row) =>
    row.map((cell) => {
      const str = cell === null || cell === undefined ? '' : String(cell);
      // Escape double quotes for CSV standard
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...formattedRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', safeFilename);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
