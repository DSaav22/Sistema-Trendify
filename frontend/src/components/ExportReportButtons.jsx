import { useState } from 'react';

const FORMATOS = [
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
];

export default function ExportReportButtons({
  disabled = false,
  onExportCsv,
  onExportPdf,
  className = '',
}) {
  const [formato, setFormato] = useState('csv');
  const [exportando, setExportando] = useState(false);

  const exportar = async () => {
    if (disabled || exportando) return;
    setExportando(true);
    try {
      if (formato === 'pdf') {
        await onExportPdf?.();
      } else {
        await onExportCsv?.();
      }
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={formato}
        onChange={(e) => setFormato(e.target.value)}
        disabled={disabled || exportando}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        aria-label="Formato de exportacion"
      >
        {FORMATOS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={exportar}
        disabled={disabled || exportando}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {exportando ? 'Exportando...' : 'Exportar'}
      </button>
    </div>
  );
}
