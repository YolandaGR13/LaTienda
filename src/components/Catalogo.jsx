import React, { useState } from "react";
import "./Catalogo.css";
import { velas } from "./data/velas";
import { preparados } from "./data/preparados";
import { rituales } from "./data/rituales";
import { consultas } from "./data/consultas";
import CarruselImagenes from "./CarruselImagenes";

const temasVelas = [
  "todos",
  "abundancia",
  "amor",
  "protección",
  "ofrendas",
  "muerte",
];

const temasPreparados = [
  "todos",
  "abundancia",
  "amor",
  "protección",
  "ofrendas",
  "espiritualidad",
  "kit",
];

const Catalogo = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("velas");
  const [temaSeleccionado, setTemaSeleccionado] = useState("todos");

  // Determinar productos y temas según categoría
  let productos = [];
  let temas = [];

  switch (categoriaSeleccionada) {
    case "velas":
      productos = velas;
      temas = temasVelas;
      break;
    case "preparados":
      productos = preparados;
      temas = temasPreparados;
      break;
    case "rituales":
      productos = rituales;
      temas = []; // sin menú de temas
      break;
    case "consultas":
      productos = consultas;
      temas = []; // sin menú de temas
      break;
    default:
      productos = [];
      temas = [];
  }

  // Filtrar por tema solo para Velas o Preparados
  if (
    ["velas", "preparados"].includes(categoriaSeleccionada) &&
    temaSeleccionado !== "todos"
  ) {
    productos = productos.filter((p) =>
      p.tema?.map((t) => t.toLowerCase()).includes(temaSeleccionado)
    );
  }

  return (
    
    <div>

        <div className="contacto-instagram">
        <a href="https://www.instagram.com/MapacheTarot" target="_blank" rel="noopener noreferrer">
          📸 Sígueme y contáctame por Instagram
        </a>
        <br />
                <a href="https://www.tiktok.com/@mapachetarot13" target="_blank" rel="noopener noreferrer">
          🎵 Sígueme y contáctame por TikTok
        </a>

      </div>


  
      <div className="mensaje-artesanal">
         Todos los productos están hechos a mano y ritualizados con intención.  
        Para encargar o personalizar, contáctame por mensaje privado en Instagram.
      </div>
      {/* Menú de categorías */}

      <div className="menu-categorias">
        {["velas", "preparados", "rituales", "consultas"].map((cat) => (
          <button
            key={cat}
            className={categoriaSeleccionada === cat ? "activo" : ""}
            onClick={() => {
              setCategoriaSeleccionada(cat);
              setTemaSeleccionado("todos");
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Menú de temas: solo para Velas y Preparados */}
      {temas.length > 0 && (
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
      )}

   
      {/* Catálogo de productos */}
      <div className="catalogo">
        {productos.length > 0 ? (
          productos.map((item, index) => (
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
              {item.Material && (
                <p>
                  <strong>Material:</strong> {item.Material}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="sin-productos">
            {`${
              categoriaSeleccionada === "consultas"
                ? "Aquí puedes agendar tu consulta próximamente."
                : categoriaSeleccionada === "rituales"
                ? "Explora nuestros rituales muy pronto."
                : "No hay productos para esta categoría."
            }`}
          </p>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
