"use client";

import { useState, useEffect, useRef } from 'react';
import { Cascadia_Mono } from 'next/font/google';

const cascadia = Cascadia_Mono({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  display: 'swap',
});

const words = ['Hola! I am Dora!', 'Upload your files!', 'Ask me about your media!'];

export default function TypewriterJS() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Si estamos en pausa, no hacemos nada
    if (isPaused) return;

    // Si acabamos de escribir la palabra completa (y no estamos borrando)
    if (subIndex === words[index].length + 1 && !reverse) {
      // Entrar en pausa antes de empezar a borrar
      setIsPaused(true);
      pauseTimeoutRef.current = setTimeout(() => {
        setReverse(true);
        setIsPaused(false);
      }, 2000); // 3 segundos de cooldown
      return;
    }

    // Si hemos borrado toda la palabra
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    // Paso normal de escritura/borrado
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, 100); // Velocidad de escritura (ajustable)

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, isPaused]);

  return (
    <h1
      className={`${cascadia.className} text-6xl mt-40 mr-17`}
      aria-label="Hola! I am Dora! Upload your files! and Ask me about your media!"
    >
      &nbsp;
      <span className="typewriter-js">
        {words[index].substring(0, subIndex)}
        <span className="cursor">|</span>
      </span>
    </h1>
  );
}
