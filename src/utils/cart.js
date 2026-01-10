// src/utils/cart.js

export function parseEuroPrice(value) {
  // Acepta "5€", "5 €", "5,50€", "5.50€"
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/\s/g, "")
    .replace("€", "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatEuro(value) {
  return `${value.toFixed(2).replace(".", ",")}€`;
}

export function buildWhatsAppLink({ baseLink, message }) {
  // baseLink puede ser:
  // - "https://wa.me/346XXXXXXXX"
  // - "https://wa.link/xxxxx" (recomendado si no quieres número “a simple vista”)
  const sep = baseLink.includes("?") ? "&" : "?";
  return `${baseLink}${sep}text=${encodeURIComponent(message)}`;
}
