"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function UploadExample() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gray-100">
      
      {/* Search bar + botón */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-96 px-6 py-3 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={() => setOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
        >
          Upload
        </button>
      </div>

      {/* POPUP */}
      <AnimatePresence>
        {open && (
          <>
            {/* Fondo blur */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute bg-white w-96 p-8 rounded-2xl shadow-2xl"
            >
              <h2 className="text-xl font-semibold mb-6">Upload file</h2>

              <input
                type="file"
                className="w-full mb-6 file:mr-4 file:py-2 file:px-4 
                           file:rounded-full file:border-0 
                           file:text-sm file:font-semibold
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>

                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Upload
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
