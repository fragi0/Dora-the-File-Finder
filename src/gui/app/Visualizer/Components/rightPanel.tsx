'use client';

export default function RightPanel({ selectedFile }: { selectedFile: any }) {
    if (!selectedFile) {
        return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Selecciona un archivo para visualizarlo
        </div>;
    }

    return (
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ color: '#38bdf8', marginBottom: '20px' }}>
                {selectedFile.original_filename}
            </h1>
            
            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                <iframe 
                    src={`http://localhost:8000/files/${selectedFile.original_filename}`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                />
            </div>
        </div>
    );
}