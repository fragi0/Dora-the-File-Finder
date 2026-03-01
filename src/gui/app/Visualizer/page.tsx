'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LeftPanel, { FileData } from './Components/leftPanel';
import RightPanel from './Components/rightPanel';

export default function VisualizerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = useMemo(() => searchParams.get('request') || '', [searchParams]);
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<FileData[]>([]);
  const [selected, setSelected] = useState<FileData | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q: string) => {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    try {
      const resp = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(term)}`);
      const data = await resp.json();
      const files: FileData[] = Array.isArray((data as any).files)
        ? (data as any).files
        : Object.entries(data)
            .filter(([k]) => k.startsWith('source'))
            .map(([, v]) => v as FileData);

      setResults(files);
      setSelected(files[0] ?? null);
      setAnswer(data?.answer ?? null);    
      router.replace(`/Visualizer?request=${encodeURIComponent(term)}`);
    } catch (e) {
      console.error('Error al buscar', e);
      setResults([]);
      setSelected(null);
      setAnswer('Ha ocurrido un error. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) doSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <div className="min-h-screen bg-[#0D3659] text-white p-6 flex flex-col gap-6">
      <div className="flex gap-3 items-center max-w-3xl mx-auto w-200">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
          placeholder="Buscar..."
          className={`flex-1 rounded-lg bg-gray-800 border border-gray-700 px-6 py-3 focus:outline-none focus:border-blue-400 shadow-lg transition w-280 ${
            query ? 'shadow-[0_0_12px_rgba(59,130,246,0.35)]' : ''
          }`}
        />
        <button
          onClick={() => doSearch(query)}
          disabled={loading}
          className="px-5 py-3 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-blue-900 shadow-lg"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Paneles */}
      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="w-80 min-w-[260px] max-w-[320px] rounded-xl border border-gray-800 bg-gray-900/70 p-3">
          <LeftPanel items={results} onSelect={setSelected} selected={selected} query={query} />
        </div>
        <RightPanel file={selected} answer={answer} />  
      </div>
    </div>
  );
}
