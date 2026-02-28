'use client'; 

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{type: 'ok'|'error', msg: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click(); 
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

      try{
        setLoading(true);
        const response = await fetch('http://localhost:8000/upload',{
          method: "POST", 
          body: formData,
        });

        const isJson = response.headers.get('content-type')?.includes('application/json');
        const body = isJson ? await response.json() : await response.text();

        if (response.ok) {
          const msg = isJson ? body.message ?? 'Archivo subido' : 'Archivo subido';
          setToast({ type: 'ok', msg });
        } else {
          const msg = isJson ? body.detail ?? body.message ?? 'Error subiendo el archivo' : (body || 'Error subiendo el archivo');
          setToast({ type: 'error', msg });
        }
      } catch (error) {
        console.error("Ha fallado la comunicación con la API:", error);
        setToast({ type: 'error', msg: 'No se pudo conectar con el servidor' });
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  return (
    <div className="relative w-full h-screen bg-cover bg-center" style={{ backgroundImage: "url('/imagenFondoDora.png')" }}>
      <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl"></div>
      
      <div className="flex flex-col relative items-center justify-center min-h-screen">
        <SearchBar />
        <button 
          onClick={handleUploadClick}
          disabled={loading}
          className="rounded-xl bg-gray-800 text-white px-32 py-12 hover:bg-blue-400 hover:text-gray-900 flex justify-center items-center hover:cursor-pointer transition h-16 mt-52 mr-20"
        >
        {loading ? 'Uploading...' : 'Upload File'}
        </button> 

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />

        {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg 
          ${toast.type === 'ok' ? 'bg-green-400 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
      </div>
    </div>
  );
}


