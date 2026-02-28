"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function UploadButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  return (
    <>
      {/* BOTÓN */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-3xl bg-gray-800 text-white px-6 py-2 
                   hover:bg-blue-400 hover:text-gray-900 
                   transition h-14 ml-6"
      >
        Upload
      </button>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay blur */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-2xl z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Popup */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50"
            >
              <div className="bg-white w-96 p-8 rounded-2xl shadow-2xl">
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
