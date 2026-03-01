'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar(){
    const [request, setRequest] = useState("");
    const router = useRouter(); 

    const searchAction = () => {
       if (!request.trim()) return;
       router.push(`/Visualizer?request=${encodeURIComponent(request.trim())}`);
    };

    return(
        <div className="flex">
            <div className="flex border border-gray-700 rounded-3xl px-2 py-2 mb-2 mt-52 w-250 h-14 bg-white/35 shadow-2xl ">
              <input 
                className="relative text-center justify-center w-250 focus:outline-none text-gray-700 mr-3.5" 
                type="text" 
                placeholder="Ask about anything in your files..." 
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchAction()}
              />
            </div> 
            <button 
              onClick={searchAction} 
              className="rounded-3xl bg-gray-800 text-white px-6 py-2 hover:bg-blue-400 hover:text-gray-900 transition h-14 ml-6 mt-52 hover:cursor-pointer">
              Search
            </button>
        </div>
    );
}
