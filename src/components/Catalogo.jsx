import React, { useState, useRef, useMemo,useCallback} from "react";
import "./Catalogo.css";
import { velas } from "./data/velas";
import { preparados } from "./data/preparados";
import { rituales } from "./data/rituales";
import { consultas } from "./data/consultas";
import CarruselImagenes from "./CarruselImagenes";
import {
  parsePriceInfo,
  formatEuro,
  buildWhatsAppLink,
  formatPriceForLine
} from "../utils/cart";
const WA_COUNTRY = "34";
const WA_NUMBER = ["657", "354", "555"].join(""); // aquí pones tus 9 dígitos en 3 trozos
const WHATSAPP_BASE = `https://wa.me/${WA_COUNTRY}${WA_NUMBER}`;



const temasVelas = ["todos", "abundancia", "amor", "protección", "ofrendas", "muerte"];
const temasPreparados = ["todos", "abundancia", "amor", "protección", "ofrendas", "espiritualidad", "kit"];
const categorias = ["velas", "preparados", "rituales", "consultas"];

export default function Catalogo() {
  const [categoria, setCategoria] = useState("velas");
  const [tema, setTema] = useState("todos");
  const [subOpen, setSubOpen] = useState(false);
  const timeoutRef = useRef(null);

  // === NUEVO: carrito ===
  // Estructura: { key: { item, qty } }
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

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
    setCategoria(cat);
    setTema("todos");
    if (["velas", "preparados"].includes(cat)) setSubOpen(true);
    else setSubOpen(false);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSubOpen(false), 2000);
  };
  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
  };

  // === NUEVO: helpers carrito ===
  const itemKey = (item) => item.id || item.nombre; // estable
  const addToCart = (item) => {
    const key = itemKey(item);
    setCart((prev) => {
      const current = prev[key];
      const qty = current ? current.qty + 1 : 1;
      return { ...prev, [key]: { item, qty } };
    });
    setCartOpen(true);
  };

  const incQty = (key) => {
    setCart((prev) => ({ ...prev, [key]: { ...prev[key], qty: prev[key].qty + 1 } }));
  };

  const decQty = (key) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = next[key].qty - 1;
      if (qty <= 0) delete next[key];
      else next[key] = { ...next[key], qty };
      return next;
    });
  };

  const removeItem = (key) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearCart = () => setCart({});

  const cartItems = useMemo(() => Object.entries(cart), [cart]);

  const cartCount = useMemo(
    () => cartItems.reduce((acc, [, v]) => acc + v.qty, 0),
    [cartItems]
  );

    const totals = useMemo(() => {
      let minTotal = 0;
      let maxTotal = 0;
      let hasRangeOrVariable = false;

      cartItems.forEach(([, v]) => {
        const info = parsePriceInfo(v.item.precio);
        const qty = v.qty;

        if (info.type === "fixed") {
          minTotal += info.min * qty;
          maxTotal += info.min * qty;
        } else if (info.type === "range") {
          hasRangeOrVariable = true;
          minTotal += info.min * qty;
          maxTotal += info.max * qty;
        } else {
          // variable/unknown
          hasRangeOrVariable = true;
          // No suma nada porque no tenemos cifra; el mínimo se mantiene
        }
    });

    return { minTotal, maxTotal, hasRangeOrVariable };
  }, [cartItems]);
  const shipping = useMemo(() => {
    // Por defecto: península (porque no sabemos destino)
    // Si el mínimo supera 80€, envío gratis.
    const base = totals.minTotal >= 80 ? 0 : 5;
    return base;
  }, [totals.minTotal]);

  const buildCartMessage = useCallback(() => {
    const lines = [];
    lines.push("Hola, quiero hacer un pedido/encargo. Te dejo mi carrito:");
    lines.push("");

    cartItems.forEach(([, v], idx) => {
      const priceLabel = formatPriceForLine(v.item.precio);
      lines.push(`${idx + 1}. ${v.item.nombre} x${v.qty} — ${priceLabel}`);
    });

    lines.push("");

    // Total: fijo vs rango/variable
    if (!totals.hasRangeOrVariable) {
      const totalConEnvio = totals.minTotal + shipping;
      lines.push(`Total productos: ${formatEuro(totals.minTotal)}`);
      lines.push(`Envío estimado (Península): ${formatEuro(shipping)} (a confirmar destino)`);
      lines.push(`Total estimado: ${formatEuro(totalConEnvio)}`);
    } else {
      // Si hay variables: damos “desde” y, si hay max distinto, también “hasta”
      lines.push(`Total productos (desde): ${formatEuro(totals.minTotal)}`);

      if (totals.maxTotal > totals.minTotal) {
        lines.push(`Total productos (hasta): ${formatEuro(totals.maxTotal)} (según opciones)`);
      } else {
        lines.push("Total productos: puede variar según opciones/personalización.");
      }

      lines.push(`Envío estimado (Península): ${formatEuro(shipping)} (a confirmar destino)`);

      const desdeConEnvio = totals.minTotal + shipping;
      lines.push(`Total estimado (desde): ${formatEuro(desdeConEnvio)}`);
    }

    lines.push("");
    lines.push("Quiero concretar contigo la intención/personalización (hierbas, colores, detalles, etc.).");
    lines.push("Destino de envío: (indícame ciudad/provincia o si es Islas/Ceuta/Melilla para ajustar).");

    return lines.join("\n");
  }, [cartItems, totals, shipping]);

  const waLink = useMemo(() => {
    const message = buildCartMessage();
    return buildWhatsAppLink({ baseLink: WHATSAPP_BASE, message });
  }, [buildCartMessage]);

  return (
    <div className="App">

      {/* === NUEVO: botón carrito flotante (si quieres) === */}
      <button className="cart-fab" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
        Carrito ({cartCount})
      </button>

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
        Para encargar o personalizar, puedes añadir al carrito y terminar por WhatsApp para concretar tu intención.
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

      {/* Submenú de temas */}
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
          productos.map((item) => {
            const key = itemKey(item);
            return (
              <div key={key} className="producto">
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

                {(item.material || item.Material) && (
                  <p><strong>Material:</strong> {item.material || item.Material}</p>
                )}

                {/* === NUEVO: botón añadir === */}
                <button className="btn-add" onClick={() => addToCart(item)}>
                  Añadir al carrito
                </button>
              </div>
            );
          })
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

      {/* === NUEVO: Drawer/Modal del carrito === */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Tu carrito</h2>
              <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>

            <div className="cart-note">
              <strong>Importante:</strong> “Terminar” abrirá WhatsApp con tu carrito y el total estimado.
              Allí hablaremos para concretar el encargo (intención, personalización, detalles).
            </div>

            {cartItems.length === 0 ? (
              <p className="cart-empty">Aún no has añadido productos.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(([key, v]) => {
                    const info = parsePriceInfo(v.item.precio);
                    const unitLabel = formatPriceForLine(v.item.precio);

                    let subtotalLabel = "";
                    if (info.type === "fixed") {
                      subtotalLabel = formatEuro(info.min * v.qty);
                    } else if (info.type === "range") {
                      const min = info.min * v.qty;
                      const max = info.max * v.qty;
                      subtotalLabel = `${formatEuro(min)}–${formatEuro(max)}`;
                    } else {
                      subtotalLabel = "Variable";
                    }

                    return (
                      <div className="cart-item" key={key}>
                        <div className="cart-item-main">
                          <div className="cart-item-title">{v.item.nombre}</div>
                          <div className="cart-item-sub">
                            {unitLabel} · Subtotal: {subtotalLabel}
                          </div>
                        </div>

                        <div className="cart-item-actions">
                          <button className="qty-btn" onClick={() => decQty(key)}>-</button>
                          <span className="qty">{v.qty}</span>
                          <button className="qty-btn" onClick={() => incQty(key)}>+</button>
                          <button className="remove-btn" onClick={() => removeItem(key)}>Eliminar</button>
                        </div>
                      </div>
                    );
                  })}
                </div>



                <div className="cart-footer">
                  <div className="cart-total">
                    Total estimado: <span>{formatEuro(totals)}</span>
                  </div>

                  <div className="cart-footer-actions">
                    <button className="btn-secondary" onClick={clearCart}>
                      Vaciar
                    </button>

                    <a
                      className="btn-primary"
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terminar por WhatsApp
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
