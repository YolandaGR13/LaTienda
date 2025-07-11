// CarruselImagenes.jsx
import React, { useState, useEffect } from "react";
import "./CarruselImagenes.css";

const CarruselImagenes = ({ imagenes }) => {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndice((prev) => (prev + 1) % imagenes.length);
    }, 3000); // Cambia de imagen cada 3 segundos
    return () => clearInterval(interval);
  }, [imagenes.length]);

  const siguiente = () => setIndice((indice + 1) % imagenes.length);
  const anterior = () => setIndice((indice - 1 + imagenes.length) % imagenes.length);

  return (
    <div className="carrusel">
      <button className="flecha" onClick={anterior}>←</button>
      <img src={imagenes[indice]} alt="producto" />
      <button className="flecha" onClick={siguiente}>→</button>
    </div>
  );
};

export default CarruselImagenes;
