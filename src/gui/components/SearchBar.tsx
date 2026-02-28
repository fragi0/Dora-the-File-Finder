'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar(){
    const [request, setRequest] = useState("");
    const router = useRouter(); 

    const searchAction = async () => {{
       router.push('/Visualizer?request=${request}') 
    }};

    return(
        <div className="flex">
            <div className="flex border border-gray-700 rounded-3xl px-2 py-2 mb-2 mt-52 w-250 h-14 bg-white/35 shadow-2xl ">
            <input 
            className="text-center w-220 focus:outline-none text-gray-700 mr-3.5" 
            type = "text" 
            placeholder = "Search a file..." 
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            />
            </div> 
            <button 
            onClick={searchAction} 
            className="rounded-3xl bg-gray-800 text-white px-6 py-2 hover:bg-blue-400 hover:text-gray-900 transition h-14 ml-6">
                Search
                </button>
        </div>
         

    )
}
