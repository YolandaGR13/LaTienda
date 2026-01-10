// src/utils/cart.js

export function parseEuroPrice(value) {
  // Mantengo compatibilidad: devuelve el mínimo detectado
  const info = parsePriceInfo(value);
  return info.min ?? 0;
}

export function formatEuro(value) {
  return `${Number(value).toFixed(2).replace(".", ",")}€`;
}

// Extra: devuelve info rica (fijo / rango / variable)
export function parsePriceInfo(value) {
  const raw = String(value ?? "").trim();

  // Caso: vacío
  if (!raw) return { type: "unknown", raw, min: 0, max: 0, hasNumbers: false };

  // Detecta números seguidos de €
  const matches = raw.match(/(\d+(?:[.,]\d+)?)\s*€/g) || [];
  const nums = matches
    .map((m) => Number(m.replace(/\s/g, "").replace("€", "").replace(",", ".")))
    .filter((n) => Number.isFinite(n));

  const lower = raw.toLowerCase();
  const isVariableWord =
    lower.includes("variable") ||
    lower.includes("a consultar") ||
    lower.includes("según") ||
    lower.includes("depende") ||
    lower.includes("personalizable");

  if (nums.length === 0) {
    // No hay números: o es variable o desconocido
    if (isVariableWord) {
      return { type: "variable", raw, min: 0, max: 0, hasNumbers: false };
    }
    return { type: "unknown", raw, min: 0, max: 0, hasNumbers: false };
  }

  const min = Math.min(...nums);
  const max = Math.max(...nums);

  if (nums.length === 1 && !isVariableWord) {
    return { type: "fixed", raw, min, max: min, hasNumbers: true };
  }

  // 2+ precios o palabras que indiquen variación
  return { type: "range", raw, min, max, hasNumbers: true };
}

export function formatPriceForLine(priceString) {
  const info = parsePriceInfo(priceString);

  if (info.type === "fixed") return formatEuro(info.min);

  if (info.type === "range") {
    // si min==max, aún así lo mostramos como fijo
    if (info.min === info.max) return formatEuro(info.min);
    return `${formatEuro(info.min)}–${formatEuro(info.max)}`;
  }

  if (info.type === "variable") return "Precio variable";
  return "Precio a consultar";
}

export function buildWhatsAppLink({ baseLink, message }) {
  const sep = baseLink.includes("?") ? "&" : "?";
  return `${baseLink}${sep}text=${encodeURIComponent(message)}`;
}
