'use client'; 

import { useRef } from "react";
import SearchBar from "@/components/SearchBar";

export default function Home() {

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click(); 
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try{
        const response= await fetch('http://localhost:8000/upload',{
          method: "POST", 
          body: formData,
        })
      }catch(error){
        console.error("Ha fallado la comunicación con la socket:", error)
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-cover bg-center" style={{ backgroundImage: "url('/imagenFondoDora.png')" }}>
      <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl"></div>

      <div className="relative flex items-center justify-center min-h-screen">
        <SearchBar />
        <button 
          onClick={handleUploadClick} 
          className="rounded-3xl bg-gray-800 text-white px-6 py-2 hover:bg-blue-400 hover:text-gray-900 transition h-14 ml-6"
        >
          Upload 
        </button> 

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
      </div>
    </div>
  );
}