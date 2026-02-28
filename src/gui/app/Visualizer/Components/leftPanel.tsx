'use client';

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface FileData {
    original_filename: string;
    content_type: string;
    upload_date: string;
}

export default function LeftPanel() {
    const searchParams = useSearchParams();
    const query = searchParams.get('request');

    const [data, setData] = useState<FileData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`http://localhost:8000/search?q=${query}`);
            const result = await response.json();
            setData(result);
        };
        if (query) fetchData();
    }, [query]);

    return(
        <div style={{display: 'grid', gap: '20px'}}>
            {data.map((file) => (
                <div key={file.original_filename}>
                    <h2><b>{file.original_filename}</b></h2>
                    <h3>{file.content_type}</h3>
                    <h3>{file.upload_date}</h3>
                </div>
            ))}
        </div>
    );
}