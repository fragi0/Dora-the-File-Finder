'use client';

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface FileData {
    original_filename: string;
    content_type: string;
    upload_date: string;
}

export default function LeftPanel({ onFileSelect }: { onFileSelect: (file: FileData) => void }) {
    const searchParams = useSearchParams();
    const query = searchParams.get('request');
    const [data, setData] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/search?query=${query}`);
                const result = await response.json();
                
                const finalData = Array.isArray(result) ? result : [];
                
                setData(finalData);
                if (finalData.length > 0) onFileSelect(finalData[0]);
            } catch (error) {
                console.error("Error fetching data:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (query) fetchData();
    }, [query, onFileSelect]);

    return (
        <div className="bg-gray-800 w-[300px] border-r border-slate-700 p-5 overflow-y-auto h-full flex flex-col gap-5">
            {loading && <p className="text-white animate-pulse">Searching...</p>}

            {!loading && data && data.length > 0 ? (
                data.map((file) => (
                    <div 
                        key={file.original_filename} 
                        onClick={() => onFileSelect(file)}
                        className="cursor-pointer p-3 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg border border-transparent hover:border-slate-500"
                    >
                        <h2 className="text-white font-bold truncate">{file.original_filename}</h2>
                        <h3 className="text-slate-400 text-xs">{file.content_type}</h3>
                        <h3 className="text-slate-500 text-[10px] mt-1">{file.upload_date}</h3>
                    </div>
                ))
            ) : (
              
                !loading && (
                    <div className="bg-blue-200 p-4 rounded-md shadow-lg">
                        <p className="text-gray-900 text-lg font-semibold leading-tight">
                            We haven't been able to find the document you're looking for.
                        </p>
                    </div>
                )
            )}
        </div>
    );
}