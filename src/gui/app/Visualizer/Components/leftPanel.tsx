'use client';

import { useEffect } from 'react';

export interface FileData {
  filename: string;
  filetype: string;
  path: string;       
  upload_date: string;
}

interface Props {
  items: FileData[];
  selected: FileData | null;
  onSelect: (f: FileData) => void;
  query: string;
}

export default function LeftPanel({ items, selected, onSelect, query }: Props) {
  useEffect(() => {
    if (!selected && items.length > 0) onSelect(items[0]);
  }, [items, selected, onSelect]);

  if (!query) return <p className="text-sm text-slate-300">Escribe algo y busca.</p>;

  return (
    <div className="space-y-3 overflow-y-auto pr-1 h-full">
      {items.map((file, i) => {
        const isActive = selected && selected.path === file.path;
        const fileUrl = `http://localhost:8000${file.path}`;
        return (
          <button
            key={`${file.path}-${i}`}
            onClick={() => onSelect(file)}
            onDoubleClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
            className={`w-full text-left p-3 rounded-lg border ${
              isActive ? 'border-blue-400 bg-blue-900/30' : 'border-gray-700 bg-gray-800/50'
            } hover:border-blue-300 transition`}
            title="Doble click para abrir en nueva pestaña"
          >
            <div className="text-sm font-semibold text-white">{file.filename}</div>
            <div className="text-xs text-gray-400">{file.filetype}</div>
            <div className="text-xs text-gray-500">{file.upload_date}</div>
          </button>
        );
      })}
      {items.length === 0 && (
        <p className="text-sm text-slate-300">Sin resultados.</p>
      )}
    </div>
  );
}
