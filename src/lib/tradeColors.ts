/**
 * Colores de banner por slug de oficio.
 * El color reemplaza el fondo bg-sb-blue del banner de la card.
 * Asociación semántica: cada color evoca el material o elemento
 * del oficio. Slugs tomados de prisma/seed/trades.ts (única fuente
 * de verdad de los oficios — ver CLAUDE.md "trades").
 */
export const TRADE_COLORS: Record<string, string> = {
  // Construcción — tonos tierra
  "albanileria": "#B45309",
  "pintura": "#6D28D9",
  "yeseria": "#9333EA",
  "revoque": "#A16207",
  "colocacion-de-pisos": "#78350F",
  "impermeabilizacion": "#475569",
  "techista": "#475569",
  "demoliciones": "#7C2D12",

  // Instalaciones
  "plomeria": "#1A6FE0",
  "electricidad": "#D97706",
  "gas": "#EA6C00",
  "aire-acondicionado-y-refrigeracion": "#0369A1",
  "calefaccion": "#DC2626",
  "instalacion-de-camaras-de-seguridad": "#1E3A8A",
  "sistemas-de-riego": "#0E7490",
  "paneles-solares": "#CA8A04",

  // Carpintería y Herrería
  "carpinteria-en-madera": "#92400E",
  "herreria": "#374151",
  "soldadura": "#1F2937",
  "fabricacion-de-muebles-a-medida": "#78350F",
  "cerrajeria": "#4B5563",
  "aberturas-de-aluminio-y-pvc": "#71717A",
  "tapiceria": "#9D174D",
  "vidrieria": "#0EA5E9",

  // Hogar
  "limpieza-de-hogar": "#0F766E",
  "jardineria": "#15803D",
  "mudanzas": "#9A3412",
  "fumigacion-y-control-de-plagas": "#4D7C0F",
  "limpieza-de-tanques-de-agua": "#0E7490",
  "decoracion-de-interiores": "#BE185D",
  "mantenimiento-de-piletas": "#0891B2",
  "service-de-electrodomesticos": "#525252",

  // Tecnología
  "service-de-pc-y-notebooks": "#2563EB",
  "redes-e-instalacion-de-wifi": "#0D9488",
  "instalacion-de-smart-tv-y-home-theater": "#7C3AED",
  "domotica": "#4338CA",
  "reparacion-de-celulares": "#0891B2",
  "instalacion-de-software-y-sistemas": "#1D4ED8",
  "seguridad-informatica": "#1E293B",
  "soporte-tecnico-remoto": "#0F766E",
};

/** Color por defecto si el oficio no está en el mapa */
export const TRADE_COLOR_DEFAULT = "#1A6FE0";

/**
 * Obtiene el color de banner para un slug de oficio.
 * Busca coincidencia exacta primero, luego coincidencia parcial.
 */
export function getTradeColor(slug?: string | null): string {
  if (!slug) return TRADE_COLOR_DEFAULT;

  if (TRADE_COLORS[slug]) return TRADE_COLORS[slug];

  const key = Object.keys(TRADE_COLORS).find(
    (k) => slug.includes(k) || k.includes(slug),
  );

  return key ? TRADE_COLORS[key] : TRADE_COLOR_DEFAULT;
}
