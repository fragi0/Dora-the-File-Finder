'use client';

import React, { useState, useEffect } from 'react';

export default function DocumentViewer({ request }: any) {
  // Solo dos "cajas": una para la lista de resultados y otra para el que elegimos ver
  const [ficheros, setFicheros] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState<any>(null);

  useEffect(() => {
    if (!request) return;
    
    // Función ultra-corta para pedir datos
    fetch(`http://localhost:8000/search?q=${request}`)
      .then(res => res.json())
      .then(data => {
        setFicheros(data);
        if (data.length > 0) setSeleccionado(data[0]);
      });
  }, [request]);

  if (ficheros.length === 0) return <p className="text-white p-4">No hay resultados.</p>;

  return (
    <div className="flex flex-col gap-4 w-full text-white">
      
      {/* 1. Mini lista de botones para elegir archivo */}
      <div className="flex gap-2 overflow-x-auto p-2">
        {ficheros.map((f, i) => (
          <button 
            key={i} 
            onClick={() => setSeleccionado(f)}
            className={`px-3 py-1 rounded-full text-xs ${seleccionado === f ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            {f.original_filename || f.filename}
          </button>
        ))}
      </div>

      {/* 2. El Visor y la Info */}
      <div className="flex gap-4 h-[600px]">
        {seleccionado && (
          <>
            <div className="flex-1 bg-white rounded-lg overflow-hidden">
              <iframe 
                src={`http://localhost:8000/files/${seleccionado.stored_filename || seleccionado.filename}`} 
                className="w-full h-full border-none"
              />
            </div>

            <div className="w-64 bg-gray-900 p-4 rounded-lg overflow-y-auto border border-gray-800">
              <h2 className="text-blue-400 font-bold mb-4">Análisis</h2>
              
              <p className="text-[10px] text-gray-500 uppercase">Nombres:</p>
              <div className="mb-4 text-sm">{seleccionado.names?.join(', ') || 'Ninguno'}</div>

              <p className="text-[10px] text-gray-500 uppercase">Keywords:</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {seleccionado.keywords?.map((k: any, i: number) => (
                  <span key={i} className="text-[10px] bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded">#{k}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}