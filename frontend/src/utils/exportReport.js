import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(filename, headers, rows) {
  const lineas = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const blob = new Blob(['\uFEFF', lineas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTablePdf({ title, subtitle = '', filename, headers, rows, orientation = 'landscape' }) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 16);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(subtitle, pageWidth - 28);
    doc.text(lines, 14, 22);
    doc.setTextColor(0, 0, 0);
  }

  autoTable(doc, {
    startY: subtitle ? 28 : 22,
    head: [headers],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generado: ${new Date().toLocaleString('es-BO')} — Pagina ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 8,
    );
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
