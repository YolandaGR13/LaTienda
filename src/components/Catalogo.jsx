import React, { useState } from "react";
import "./Catalogo.css";
import { velas } from "./data/velas";
import { preparados } from "./data/preparados";
import CarruselImagenes from "./CarruselImagenes";

const temasVelas = [
  "todos",
  "abundancia",
  "amor",
  "protección",
  "ofrendas",
  "muerte"
];

const temasPreparados = [
  "todos",
  "abundancia",
  "amor",
  "protección",
  "ofrendas",
  "espiritualidad",
  "kit"
];

const Catalogo = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("velas");
  const [temaSeleccionado, setTemaSeleccionado] = useState("todos");

  let productos = categoriaSeleccionada === "velas" ? velas : preparados;
  const temas = categoriaSeleccionada === "velas" ? temasVelas : temasPreparados;

  if (temaSeleccionado !== "todos") {
    productos = productos.filter(
      (p) => p.tema && p.tema.map(t => t.toLowerCase()).includes(temaSeleccionado)
    );
  }

  return (
    <div>
      <div className="menu-categorias">
        <button
          className={categoriaSeleccionada === "velas" ? "activo" : ""}
          onClick={() => {
            setCategoriaSeleccionada("velas");
            setTemaSeleccionado("todos");
          }}
        >
          Velas
        </button>
        <button
          className={categoriaSeleccionada === "preparados" ? "activo" : ""}
          onClick={() => {
            setCategoriaSeleccionada("preparados");
            setTemaSeleccionado("todos");
          }}
        >
          Preparados
        </button>
      </div>

      <div className="contacto-instagram">
        <a href="https://www.instagram.com/TU_USUARIO" target="_blank" rel="noopener noreferrer">
          📸 Sígueme y contáctame por Instagram
        </a>
      </div>

      <div className="mensaje-artesanal">
        🫣 Todos los productos están hechos a mano y ritualizados con intención.  
        Para encargar o personalizar, contáctame por mensaje privado en Instagram.
      </div>

      <div className="menu-temas">
        {temas.map((tema) => (
          <button
            key={tema}
            className={temaSeleccionado === tema ? "activo" : ""}
            onClick={() => setTemaSeleccionado(tema)}
          >
            {tema.charAt(0).toUpperCase() + tema.slice(1)}
          </button>
        ))}
      </div>

      <div className="catalogo">
        {productos.map((item, index) => (
          <div key={index} className="producto">
            <div className="imagen-con-hover">
              {Array.isArray(item.imagen) ? (
                <CarruselImagenes imagenes={item.imagen} />
              ) : (
                <img src={item.imagen} alt={item.nombre} />
              )}
              <div className="precio-hover">{item.precio}</div>
            </div>
            <h3>{item.nombre}</h3>
            <p>{item.descripcion}</p>
            <p><strong>Material:</strong> {item.Material}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalogo;
