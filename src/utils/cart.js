// src/utils/cart.js

export function formatEuro(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "A consultar";
  return `${n.toFixed(2).replace(".", ",")}€`;
}

/**
 * Tipos:
 * - fixed: {min,max}
 * - range: {min,max}   (ej: "6€ - 8€")
 * - options: {options:[{label,price}], min,max} (ej: "Macerada: 6€ Destilada: 7€" o "S: 6€ G: 7€")
 * - variable: palabras tipo "variable / a consultar / depende" sin números útiles
 * - unknown: no detecta nada
 */
export function parsePriceInfo(value) {
  const raw = String(value ?? "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return { type: "unknown", raw };

  const hasVariableWords =
    lower.includes("Variable") ||
    lower.includes("G:") ||
    lower.includes(" - ") ||
    lower.includes("S:");

  // 1) Opciones con etiqueta: "X: 6€"
  const optionRegex = /([a-záéíóúüñ0-9]+)\s*:\s*(\d+(?:[.,]\d+)?)\s*€/gi;
  const options = [];
  let m;
  while ((m = optionRegex.exec(raw)) !== null) {
    const label = m[1].trim();
    const price = Number(m[2].replace(",", "."));
    if (Number.isFinite(price)) options.push({ label, price });
  }
  if (options.length >= 2) {
    const prices = options.map((o) => o.price);
    return {
      type: "options",
      raw,
      options,
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  // 2) Detecta precios con €
  const matches = raw.match(/(\d+(?:[.,]\d+)?)\s*€/g) || [];
  const nums = matches
    .map((x) => Number(x.replace(/\s/g, "").replace("€", "").replace(",", ".")))
    .filter((n) => Number.isFinite(n));

  // 3) Si no hay números
  if (nums.length === 0) {
    if (hasVariableWords) return { type: "variable", raw };
    return { type: "unknown", raw };
  }

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  // 4) Si hay exactamente 1 número y no hay palabras “variable”
  if (nums.length === 1 && !hasVariableWords) {
    return { type: "fixed", raw, min, max: min };
  }

  // 5) 2+ números => rango
  return { type: "range", raw, min, max };
}

// Compatibilidad: devuelve mínimo numérico
export function parseEuroPrice(value) {
  const info = parsePriceInfo(value);
  return info.min ?? 0;
}

export function formatPriceForLine(priceString) {
  const info = parsePriceInfo(priceString);

  if (info.type === "fixed") return formatEuro(info.min);
  if (info.type === "range") return `${formatEuro(info.min)}–${formatEuro(info.max)}`;
  if (info.type === "options") return `${formatEuro(info.min)}–${formatEuro(info.max)}`;
  if (info.type === "variable") return "Precio variable";
  return "Precio a consultar";
}

export function buildWhatsAppLink({ baseLink, message }) {
  const sep = baseLink.includes("?") ? "&" : "?";
  return `${baseLink}${sep}text=${encodeURIComponent(message)}`;
}
