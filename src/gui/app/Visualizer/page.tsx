'use client';

import { useSearchParams } from 'next/navigation';
import DocumentViewer from './Components/DocumentViewer';

export default function VisualizerPage() {
  const searchParams = useSearchParams();
  const loQueElUsuarioBusco = searchParams.get('request'); 

  return (
    <div className="min-h-screen bg-gray-900 p-10">
      <h1 className="text-white text-2xl mb-8">
        Mostrando resultados para: <span className="text-blue-400 font-bold">{loQueElUsuarioBusco}</span>
      </h1>
      <DocumentViewer request={loQueElUsuarioBusco} />
    </div>
  );
}