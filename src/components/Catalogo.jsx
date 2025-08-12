import React, { useState, useRef } from "react";
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

const categorias = ["velas", "preparados", "rituales", "consultas"];

export default function Catalogo() {
  const [categoria, setCategoria] = useState("velas");
  const [tema, setTema] = useState("todos");
  const [subOpen, setSubOpen] = useState(false);
  const timeoutRef = useRef(null);

  // Productos y temas según categoría
  let productos = { velas, preparados, rituales, consultas }[categoria] || [];
  let temasActivos =
    categoria === "velas" ? temasVelas :
    categoria === "preparados" ? temasPreparados : [];

  // Filtrar si tema distinto de todos
  if (["velas", "preparados"].includes(categoria) && tema !== "todos") {
    productos = productos.filter((p) =>
      p.tema?.map(t => t.toLowerCase()).includes(tema)
    );
  }

  const handleCatClick = (cat) => {
    // Cambia categoría y resetea tema, abre submenú si aplica
    setCategoria(cat);
    setTema("todos");
    if (["velas", "preparados"].includes(cat)) {
      setSubOpen(true);
    } else {
      setSubOpen(false);
    }
  };

  const handleMouseLeave = () => {
    // Al salir de submenú, programa cierre en 2 s
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSubOpen(false), 2000);
  };
  const handleMouseEnter = () => {
    // Si vuelve a entrar, cancelamos cierre
    clearTimeout(timeoutRef.current);
  };

  return (
    <div className="App">


      {/* Contacto */}
      <div className="contacto-instagram">
        <a href="https://instagram.com/MapacheTarot" target="_blank" rel="noopener noreferrer">
          📸 Sígueme en Instagram
        </a>
        <a href="https://tiktok.com/@mapachetarot13" target="_blank" rel="noopener noreferrer">
          🎵 Sígueme en TikTok
        </a>
      </div>

      {/* Mensaje */}
      <div className="mensaje-artesanal">
        Todos los productos están hechos a mano y ritualizados con intención.
        Para encargar o personalizar, contáctame por mensaje privado en Instagram.
      </div>
      <div className="mensaje-envio">
        Gastos de envio a España peninsular: 5€.
        Gastos de envio a Baleares, Canarias, Ceuta y Melilla: 10€.
        Gastos de envio superior a 80€: gratis.
      </div>

      {/* Menú de categorías */}
      <div className="menu-categorias">
        {categorias.map((cat) => (
          <button
            key={cat}
            className={categoria === cat ? "activo" : ""}
            onClick={() => handleCatClick(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Submenú de temas (click + autohide) */}
      {subOpen && temasActivos.length > 0 && (
        <div
          className="menu-temas"
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
        >
          {temasActivos.map((t) => (
            <button
              key={t}
              className={tema === t ? "activo" : ""}
              onClick={() => setTema(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Catálogo */}
      <div className="catalogo">
        {productos.length > 0 ? (
          productos.map((item) => (
            <div key={item.id || item.nombre} className="producto">
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
                <p><strong>Material:</strong> {item.Material}</p>
              )}
            </div>
          ))
        ) : (
          <p className="sin-productos">
            {categoria === "consultas"
              ? "Aquí puedes agendar tu consulta próximamente."
              : categoria === "rituales"
              ? "Explora nuestros rituales muy pronto."
              : "No hay productos para esta categoría."}
          </p>
        )}
      </div>
    </div>
  );
}
