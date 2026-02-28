import Image from "next/image";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (

       <div className="relative w-full h-screen bg-cover bg-center" style={{ backgroundImage: "url('/imagenFondoDora.png')" }}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl"></div>

       <div className="relative flex items-center justify-center min-h-screen">
        <SearchBar />
        <button className= "rounded-3xl bg-gray-800 text-white px-6 py-2 hover:bg-blue-400 hover:text-gray-900 transition h-14 ml-6">Upload </button>
      </div>
    </div>
   
  );
}
