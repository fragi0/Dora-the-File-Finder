'use client';

import { useEffect, useState } from 'react';
import type { FileData } from './leftPanel';

export default function RightPanel({ file, answer }: { file: FileData | null; answer?: string | null }) {
  const [mounted, setMounted] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!file || !isTextLike(file)) {
      setTextContent('');
      return;
    }
    const url = getUrl(file);
    setTextLoading(true);
    fetch(url)
      .then((r) => r.text())
      .then((t) => setTextContent(t))
      .catch(() => setTextContent('No se pudo cargar el texto.'))
      .finally(() => setTextLoading(false));
  }, [file]);

  if (!mounted) return null;

  if (!file) {
    if (answer) {
      return (
        <div className="flex-1 flex flex-col gap-4">
          <div className="rounded-lg border border-blue-400/40 bg-blue-900/20 px-4 py-3 text-sm text-blue-100">
            {answer}
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/60 text-gray-300 flex items-center justify-center">
        Selecciona un archivo
      </div>
    );
  }

  const url = getUrl(file);
  const isImage = isImg(file);
  const isPdf = isPdfType(file);
  const isText = isTextLike(file);

  return (
    <div className="flex-1 flex flex-col gap-4">
      {answer && (
        <div className="rounded-lg border border-blue-400/40 bg-blue-900/20 px-4 py-3 text-sm text-blue-100">
          {answer}
        </div>
      )}

      <div className="h-[420px] rounded-xl border border-gray-800 bg-black/60 overflow-hidden">
        {isImage ? (
          <img src={url} className="w-full h-full object-contain bg-gray-950" />
        ) : isText ? (
          <div className="w-full h-full overflow-auto bg-gray-950 text-gray-200 p-3 font-mono text-sm whitespace-pre-wrap">
            {textLoading ? 'Cargando texto...' : textContent || 'Archivo vacío.'}
          </div>
        ) : isPdf ? (
          <iframe src={url} className="w-full h-full border-0 bg-gray-950" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sin previsualización para este tipo ({file.filetype}).{' '}
            <a href={url} target="_blank" rel="noreferrer" className="text-blue-300 underline ml-1">
              Abrir/descargar
            </a>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 text-sm text-gray-200 space-y-2">
        <div><span className="text-gray-400">Nombre:</span> {file.filename}</div>
        <div><span className="text-gray-400">Tipo:</span> {file.filetype}</div>
        <div><span className="text-gray-400">Fecha:</span> {file.upload_date}</div>
        <div>
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-300 underline">
            Abrir en nueva pestaña
          </a>
        </div>
      </div>
    </div>
  );
}

/* Utils */
function getUrl(file: FileData) {
  return `http://localhost:8000${file.path}`;
}

function guessExt(file: FileData) {
  const name = file.filename || '';
  const ext = name.includes('.') ? name.split('.').pop() || '' : '';
  return ext.toLowerCase();
}

const TEXT_EXTS = new Set([
  'txt','md','markdown','json','yaml','yml','xml','html','htm','css','scss','less',
  'js','mjs','cjs','ts','tsx','jsx','c','cc','cpp','cxx','h','hh','hpp','rs','go',
  'rb','py','r','php','pl','sh','bash','zsh','ksh','ps1','java','kt','kts','scala',
  'sql','toml','ini','conf','cfg','log','csv','tsv'
]);

function isTextLike(file: FileData) {
  const ct = (file.filetype || '').toLowerCase();
  const ext = guessExt(file);
  if (ct.startsWith('text/')) return true;
  if (TEXT_EXTS.has(ext)) return true;
  return false;
}

function isImg(file: FileData) {
  return /(png|jpe?g|gif|webp|bmp|tiff)$/i.test(guessExt(file));
}

function isPdfType(file: FileData) {
  return /pdf/i.test(guessExt(file)) || /pdf/i.test(file.filetype || '');
}
