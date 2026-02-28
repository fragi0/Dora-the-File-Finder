

export default function SearchBar(){
    return(
        <div className="flex border border-gray-700 rounded-3xl px-2 py-2 mb-2 w-4xl h-14 bg-white/35 shadow-2xl ">
            <input className="text-center w-220 focus:outline-none text-gray-700 mr-3.5" type = "text" placeholder = "Search a file..." />
        </div>  
    )
}
