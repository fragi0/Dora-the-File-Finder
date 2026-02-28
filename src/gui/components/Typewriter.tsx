// components/TypewriterJS.tsx
"use client";

import { useState, useEffect } from 'react';
import {Cascadia_Mono} from 'next/font/google';

const cascadia = Cascadia_Mono({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  display: 'swap',
});

const words = ['PDFs', 'DOCX', 'IMAGES', 'PPTX', 'XSLX'];

export default function TypewriterJS() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    // Si hemos terminado de escribir la palabra actual
    if (subIndex === words[index].length + 1 && !reverse) {
      setReverse(true);
      return;
    }

    // Si hemos borrado toda la palabra
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, 500); // Velocidad de escritura (ajustable)

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <h1 className={`${cascadia.className} text-6xl mt-40 mr-17`} aria-label="Manage your PDFs, DOCX, IMAGES, PPTX and EXCELS">
    
      Manage your&nbsp;
      <span className="typewriter-js">
        {words[index].substring(0, subIndex)}
        <span className="cursor">|</span>
      </span>
    </h1>
  );
}
