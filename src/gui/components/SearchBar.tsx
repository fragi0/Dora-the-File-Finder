

export default function SearchBar(){
    return(
        <div className="flex border border-gray-700 rounded-3xl px-2 py-2 mb-2 w-224 h-14 bg-white/40 shadow-2xl ">
            <input className="text-center w-220 focus:outline-none text-gray-900 mr-3.5" type = "text" placeholder = "Search a file..." />
        </div>
    )
}
