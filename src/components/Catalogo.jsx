import React, { useState, useRef, useMemo, useCallback } from "react";
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
  formatPriceForLine,
} from "../utils/cart";

const WA_COUNTRY = "34";
const WA_NUMBER = ["657", "354", "555"].join("");
const WHATSAPP_BASE = `https://wa.me/${WA_COUNTRY}${WA_NUMBER}`;

const temasVelas = ["todos", "abundancia", "amor", "protección", "ofrendas", "muerte"];
const temasPreparados = ["todos", "abundancia", "amor", "protección", "ofrendas", "espiritualidad", "kit"];
const categorias = ["velas", "preparados", "rituales", "consultas"];

export default function Catalogo() {
  const [categoria, setCategoria] = useState("velas");
  const [tema, setTema] = useState("todos");
  const [subOpen, setSubOpen] = useState(false);
  const timeoutRef = useRef(null);

  // Carrito: { key: { item, qty, optionLabel, optionPrice, isVariable } }
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);

  // Modal selector (para options y para range "-")
  const [pickOpen, setPickOpen] = useState(false);
  const [pickItem, setPickItem] = useState(null); // { item, options:[{label,price}], mode:"options"|"range" }

  // Productos y temas
  let productos = { velas, preparados, rituales, consultas }[categoria] || [];
  let temasActivos =
    categoria === "velas" ? temasVelas :
    categoria === "preparados" ? temasPreparados : [];

  if (["velas", "preparados"].includes(categoria) && tema !== "todos") {
    productos = productos.filter((p) =>
      p.tema?.map((t) => t.toLowerCase()).includes(tema)
    );
  }

  const handleCatClick = (cat) => {
    setCategoria(cat);
    setTema("todos");
    setSubOpen(["velas", "preparados"].includes(cat));
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSubOpen(false), 2000);
  };
  const handleMouseEnter = () => clearTimeout(timeoutRef.current);

  const itemKey = (item) => item.id || item.nombre;

  const addToCartFinal = (item, opt, isVariable = false) => {
    const keyBase = itemKey(item);
    const key = opt ? `${keyBase}__${opt.label}` : keyBase;

    setCart((prev) => {
      const current = prev[key];
      const qty = current ? current.qty + 1 : 1;

      return {
        ...prev,
        [key]: {
          item,
          qty,
          optionLabel: opt?.label ?? null,
          optionPrice: typeof opt?.price === "number" ? opt.price : null,
          isVariable,
        },
      };
    });

    setCartOpen(true);
  };

  // --- ADD TO CART con selector si range "-" o options "X: Y€"
  const addToCart = (item) => {
    const info = parsePriceInfo(item.precio);

    // Opciones tipo "Macerada: 6€ Destilada: 7€"
    if (info.type === "options") {
      setPickItem({
        item,
        mode: "options",
        options: info.options.map((o) => ({
          label: o.label,
          price: o.price,
        })),
      });
      setPickOpen(true);
      return;
    }

    // Rango tipo "6€ - 8€": aquí quieres 2 botones al añadir
    if (info.type === "range" && info.min !== info.max) {
      setPickItem({
        item,
        mode: "range",
        options: [
          { label: "Min", price: info.min },
          { label: "Max", price: info.max },
        ],
      });
      setPickOpen(true);
      return;
    }

    // Variable: entra al carrito como "Precio variable"
    if (info.type === "variable" || info.type === "unknown") {
      addToCartFinal(item, null, true);
      return;
    }

    // Fixed o range degenerado (min==max) -> entra directo con precio fijo
    addToCartFinal(item, { label: "Precio", price: info.min }, false);
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

  // Totales:
  // - si hay variable => total muestra "+ a consultar"
  // - minTotal suma SOLO precios fijos conocidos (optionPrice)
  // - maxTotal suma si procede (si hay rangos no seleccionados no debería ocurrir porque obligamos a elegir)
  const totals = useMemo(() => {
    let minTotal = 0;
    let maxTotal = 0;
    let hasVariable = false;

    cartItems.forEach(([, v]) => {
      const qty = v.qty;

      if (v.isVariable) {
        hasVariable = true;
        return;
      }

      if (typeof v.optionPrice === "number") {
        minTotal += v.optionPrice * qty;
        maxTotal += v.optionPrice * qty;
        return;
      }

      // fallback (no debería pasar)
      const info = parsePriceInfo(v.item.precio);
      if (info.type === "fixed") {
        minTotal += info.min * qty;
        maxTotal += info.min * qty;
      } else {
        hasVariable = true;
      }
    });

    return { minTotal, maxTotal, hasVariable };
  }, [cartItems]);

  // Envío:
  // - 0€ si minTotal >= 80
  // - si hay variable, el envío puede acabar siendo 0€ o 5€ -> mostramos rango 0–5
  // - si no hay variable y minTotal < 80 -> 5€
  const shippingInfo = useMemo(() => {
    const NEAR_FREE_THRESHOLD = 50;

    // 80+ => gratis SIEMPRE
    if (totals.minTotal >= 80) {
      return { type: "fixed", value: 0, label: formatEuro(0) };
    }

    // Si hay variables y ya estamos en 50+ => "según pedido"
    if (totals.hasVariable && totals.minTotal >= NEAR_FREE_THRESHOLD) {
      return {
        type: "unknown",
        value: 5, // valor por defecto si necesitas uno interno, pero NO se muestra como número
        label: "Según pedido",
      };
    }

    // En el resto => 5€
    return { type: "fixed", value: 5, label: formatEuro(5) };
  }, [totals.minTotal, totals.hasVariable]);

  const buildCartMessage = useCallback(() => {
    const lines = [];
    lines.push("Hola, quiero hacer un pedido/encargo. Te dejo mi carrito:");
    lines.push("");

    cartItems.forEach(([, v], idx) => {
      const opt = v.optionLabel ? ` (${v.optionLabel.toUpperCase()})` : "";
      const unitLabel = v.isVariable
        ? "Precio variable"
        : (typeof v.optionPrice === "number" ? formatEuro(v.optionPrice) : formatPriceForLine(v.item.precio));

      lines.push(`${idx + 1}. ${v.item.nombre}${opt} x${v.qty} — ${unitLabel}`);
    });

    lines.push("");

    // Envío en mensaje
    let envioLabel = "";
    <span>{shippingInfo.label}</span>


    // Total
    if (!totals.hasVariable) {
      const totalFinal = totals.minTotal + (shippingInfo.type === "fixed" ? shippingInfo.value : 5);
      lines.push(`Total productos: ${formatEuro(totals.minTotal)}+ consultar`);
      lines.push(`Envío: ${envioLabel}`);
      lines.push(`Total: ${formatEuro(totalFinal)}+ consultar`);
    } else {
      lines.push(`Total productos: ${formatEuro(totals.minTotal)}`);
      lines.push(`Envío: ${envioLabel}`);
      lines.push(`Total estimado: ${formatEuro(totals.minTotal)}+ consultar `);
    }

    lines.push("");
    lines.push("Quiero concretar contigo la intención/personalización (hierbas, colores, detalles, etc.).");
    lines.push("Destino de envío: (indícame ciudad/provincia o si es Islas/Ceuta/Melilla para ajustar).");

    return lines.join("\n");
  }, [cartItems, totals, shippingInfo]);

  const waLink = useMemo(() => {
    const message = buildCartMessage();
    return buildWhatsAppLink({ baseLink: WHATSAPP_BASE, message });
  }, [buildCartMessage]);

  return (
    <div className="App">
      <button className="cart-fab" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
        Carrito ({cartCount})
      </button>

      <div className="contacto-instagram">
        <a href="https://instagram.com/MapacheTarot" target="_blank" rel="noopener noreferrer">
          📸 Sígueme en Instagram
        </a>
        <a href="https://tiktok.com/@mapachetarot13" target="_blank" rel="noopener noreferrer">
          🎵 Sígueme en TikTok
        </a>
      </div>

      <div className="mensaje-artesanal">
        Todos los productos están hechos a mano y ritualizados con intención.
        Para encargar o personalizar, puedes añadir al carrito y terminar por WhatsApp para concretar tu intención.
      </div>

      <div className="mensaje-envio">
        Gastos de envio a España peninsular: 5€.
        Gastos de envio a Baleares, Canarias, Ceuta y Melilla: 10€.
        Gastos de envio superior a 80€: gratis.
      </div>

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

      {subOpen && temasActivos.length > 0 && (
        <div className="menu-temas" onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter}>
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

      {/* Selector para options y range "-" */}
      {pickOpen && pickItem && (
        <div className="cart-overlay" onClick={() => setPickOpen(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Elige una opción</h2>
              <button className="cart-close" onClick={() => setPickOpen(false)}>✕</button>
            </div>

            <div className="cart-note">
              <strong>{pickItem.item.nombre}</strong><br />
              {pickItem.mode === "range"
                ? "Este producto tiene un rango. Elige qué precio quieres añadir al carrito:"
                : "Selecciona la variante que quieres añadir al carrito:"}
            </div>

            <div className="cart-items">
              {pickItem.options.map((opt) => (
                <button
                  key={opt.label}
                  className="btn-primary"
                  style={{ width: "100%", marginBottom: "0.6rem" }}
                  onClick={() => {
                    const label =
                      pickItem.mode === "range"
                        ? (opt.label === "Min" ? "Rango mínimo" : "Rango máximo")
                        : opt.label;

                    addToCartFinal(pickItem.item, { label, price: opt.price }, false);
                    setPickOpen(false);
                    setPickItem(null);
                  }}
                >
                  {pickItem.mode === "range"
                    ? (opt.label === "Min" ? `Mínimo — ${formatEuro(opt.price)}` : `Máximo — ${formatEuro(opt.price)}`)
                    : `${opt.label.toUpperCase()} — ${formatEuro(opt.price)}`}
                </button>
              ))}
            </div>

            <button
              className="btn-secondary"
              onClick={() => setPickOpen(false)}
              style={{ marginTop: "0.6rem", width: "100%" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Carrito */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Tu carrito</h2>
              <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>

            <div className="cart-note">
              <strong>Importante:</strong> “Terminar” abrirá WhatsApp con tu carrito y el total.
              Allí hablaremos para concretar el encargo (intención, personalización, detalles).
            </div>

            {cartItems.length === 0 ? (
              <p className="cart-empty">Aún no has añadido productos.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(([key, v]) => {
                    const opt = v.optionLabel ? ` (${v.optionLabel.toUpperCase()})` : "";
                    const unitLabel = v.isVariable
                      ? "Precio variable"
                      : (typeof v.optionPrice === "number" ? formatEuro(v.optionPrice) : formatPriceForLine(v.item.precio));

                    let subtotalLabel = "Precio variable";
                    if (!v.isVariable && typeof v.optionPrice === "number") {
                      subtotalLabel = formatEuro(v.optionPrice * v.qty);
                    }

                    return (
                      <div className="cart-item" key={key}>
                        <div className="cart-item-main">
                          <div className="cart-item-title">{v.item.nombre}{opt}</div>
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
                  {/* ENVÍO */}
                  <div className="cart-total">
                      Envío: <span>{shippingInfo.label}</span>
                  
                  </div>

                  {/* TOTAL */}
                  <div className="cart-total">
                    Total:
                    <span>
                      {totals.hasVariable
                        ? `${formatEuro(totals.minTotal)}+ a consultar`
                        : formatEuro(totals.minTotal + (shippingInfo.type === "fixed" ? shippingInfo.value : 5))}
                    </span>
                  </div>

                  <div className="cart-footer-actions">
                    <button className="btn-secondary" onClick={clearCart}>
                      Vaciar
                    </button>

                    <a className="btn-primary" href={waLink} target="_blank" rel="noopener noreferrer">
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
