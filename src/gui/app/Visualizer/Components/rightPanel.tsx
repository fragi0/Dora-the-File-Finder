'use client';

export default function RightPanel({ selectedFile }: { selectedFile: any }) {
    if (!selectedFile) {
        return ;
    }

    return (
        
        <div className="flex flex-col h-screen w-full">
            <div className="h-1/2 border-b border-slate-700 p-6 overflow-y-auto bg-gray-600">
                <h1 className="text-white" style={{ marginBottom: '20px' }}>
                    {selectedFile.original_filename}
                </h1>
            </div>
                
            <div className="h-1/2 p-6 overflow-y-auto bg-gray-800">
                <h1 className="text-xl font-bold text-white">  
                    {selectedFile.original_filename}
                </h1>
            </div>
    
        </div>
    );

    function pdfDisplay(){
    <iframe
                   src={`http://localhost:8000/${selectedFile.path}`}
                   style={{ width: '100%', height: '100%', border: 'none' }}
                />
}

}

