'use client';
import React, { useState } from 'react'; 
import LeftPanel from './Components/leftPanel';
import RigthPanel from './Components/rightPanel';

export default function VisualizerPage() {
    // Esta es la variable que ambos comparten
    const [fileFocus, setFileFocus] = useState<any>(null);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0D3659' }}>
            {/* Le pasamos la función para actualizar el foco */}
            <LeftPanel onFileSelect = {(file: any) => setFileFocus(file)} />
            
            {/* Le pasamos el archivo que debe mostrar */}
            <RigthPanel selectedFile = {fileFocus} />
        </div>
    );
}