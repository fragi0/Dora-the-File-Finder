'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { FileData } from './leftPanel';

const DocViewer = dynamic(
  () => import('@cyntler/react-doc-viewer').then((m) => m.default),
  { ssr: false }
);

export default function RightPanel({ file }: { file: FileData | null }) {
  const [mounted, setMounted] = useState(false);
  const [renderers, setRenderers] = useState<any[]>([]);
  const [textContent, setTextContent] = useState<string>('');
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  // Cargar renderers una vez
  useEffect(() => {
    import('@cyntler/react-doc-viewer').then((m) => {
      setRenderers(m.DocViewerRenderers || []);
    });
  }, []);

  // Cargar TXT cuando aplica
  useEffect(() => {
    if (!file) {
      setTextContent('');
      return;
    }
    if (!isTxt(file)) {
      setTextContent('');
      return;
    }
    const url = getUrl(file);
    setTextLoading(true);
    fetch(url)
      .then((r) => r.text())
      .then((t) => setTextContent(t))
      .catch((e) => {
        console.error('Error cargando txt', e);
        setTextContent('No se pudo cargar el texto.');
      })
      .finally(() => setTextLoading(false));
  }, [file]);

  const url = file ? getUrl(file) : '';
  const docs = useMemo(
    () => (file ? [{ uri: url, fileType: guessExt(file) }] : []),
    [url, file]
  );

  if (!mounted) return null;

  if (!file) {
    return (
      <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/60 text-gray-300 flex items-center justify-center">
        Selecciona un archivo
      </div>
    );
  }

  const isImage = isImg(file);
  const isPdf = isPdfType(file);
  const isText = isTxt(file);
  const isDocOffice = isOffice(file) || isOdf(file);

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="h-[420px] rounded-xl border border-gray-800 bg-black/60 overflow-hidden">
        {isImage ? (
          <img src={url} className="w-full h-full object-contain bg-gray-950" />
        ) : isText ? (
          <div className="w-full h-full overflow-auto bg-gray-950 text-gray-200 p-3 font-mono text-sm whitespace-pre-wrap">
            {textLoading ? 'Cargando texto...' : textContent || 'Archivo vacío.'}
          </div>
        ) : isPdf || isDocOffice ? (
          renderers.length > 0 ? (
            <DocViewer
              documents={docs}
              pluginRenderers={renderers}
              style={{ width: '100%', height: '100%' }}
              config={{ header: { disableHeader: true, disableFileName: true } }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Cargando visor...
            </div>
          )
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
function isTxt(file: FileData) {
  return /text\/plain/i.test(file.filetype || '') || /\.txt$/i.test(file.filename || '');
}
function isImg(file: FileData) {
  return /(png|jpe?g|gif|webp|bmp|tiff)$/i.test(guessExt(file));
}
function isPdfType(file: FileData) {
  return /pdf/i.test(guessExt(file)) || /pdf/i.test(file.filetype || '');
}
function isOffice(file: FileData) {
  return /(docx?|pptx?|xlsx?)$/i.test(guessExt(file));
}
function isOdf(file: FileData) {
  return /(odt|ods|odp)$/i.test(guessExt(file));
}
