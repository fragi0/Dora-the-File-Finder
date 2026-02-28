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

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`http://localhost:8000/search?q=${query}`);
            const result = await response.json();
            setData(result);
            // Opcional: enfocar el primero al cargar
            if(result.length > 0) onFileSelect(result[0]);
        };
        if (query) fetchData();
    }, [query]);

    return(
        <div style={{display: 'grid', gap: '20px', width: '300px', borderRight: '1px solid #334155', padding: '20px', overflowY: 'auto'}}>
            {data.map((file) => (
                <div 
                    key={file.original_filename} 
                    onClick={() => onFileSelect(file)}
                    style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#1e293b', borderRadius: '8px' }}
                >
                    <h2 style={{color: 'white'}}><b>{file.original_filename}</b></h2>
                    <h3 style={{color: '#94a3b8', fontSize: '0.8rem'}}>{file.content_type}</h3>
                    <h3 style={{color: '#64748b', fontSize: '0.7rem'}}>{file.upload_date}</h3>
                </div>
            ))}
        </div>
    );
}