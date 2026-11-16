/**
 * Lectura de la planilla de Google Sheets del stock y comparación con los
 * vehículos cargados en la web. Lógica pura (sin acceso a red ni a React).
 *
 * Importante: solo se usan modelo, color, año, km y el precio público. La
 * columna "INFO 26" y las notas internas de la planilla NO se leen.
 */

export const SHEET_ID = "16WBDELGRENY08zZiJRnsWm6cP-lB55Q-kGmE0R_RWSk";
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export type SheetVehicle = {
  /** Identificador estable para recordar decisiones ("Ignorar"). */
  key: string;
  section: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  km: number | null;
  priceLabel: string;
  /** Solo si el precio de la planilla está en USD. */
  priceUsd: number | null;
};

type WebVehicleLike = {
  id: string;
  marca: string | null;
  modelo: string | null;
  nombre: string | null;
  año: number | string | null;
  km: number | string | null;
  tipo: string | null;
  activo: boolean;
};

export type SheetMatch<T> = { sheet: SheetVehicle; web: T };

export type SheetComparison<T> = {
  added: SheetVehicle[];
  removed: T[];
  matched: SheetMatch<T>[];
};

export const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const digits = (value: unknown) => String(value ?? "").replace(/[^\d]/g, "");

/** Parser CSV mínimo (comillas dobles, comas y saltos de línea dentro de celdas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** "MODELO X" → "Modelo X", dejando en mayúsculas siglas y códigos (AT, 4X4, SRX). */
export function tidyName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (/\d/.test(word) || word.length <= 3) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

const NON_BRAND_SECTIONS = new Set(["camion", "moto", "motos", "utilitario"]);

const parsePrice = (raw: string) => {
  const label = raw.replace(/\s+/g, " ").trim();
  if (!label) return { label: "", usd: null as number | null };
  const isUsd = /usd|u\$s/i.test(label);
  const amount = Number.parseInt(digits(label), 10);
  return {
    label,
    usd: isUsd && Number.isFinite(amount) && amount > 0 ? amount : null,
  };
};

export function parseSheet(csv: string, currentYear = new Date().getFullYear()) {
  const rows = parseCsv(csv);
  const vehicles: SheetVehicle[] = [];
  let section = "";
  const seen = new Map<string, number>();

  for (const cells of rows) {
    const name = (cells[0] ?? "").replace(/\s+/g, " ").trim();
    if (!name) continue;

    const color = (cells[1] ?? "").replace(/\s+/g, " ").trim();
    const yearRaw = digits(cells[2]);
    const kmRaw = digits(cells[3]);
    const priceRaw = cells[4] ?? "";

    const isDataRow = Boolean(yearRaw);
    if (!isDataRow) {
      // Fila de título (marca/categoría) o de encabezado: solo texto en la primera celda.
      const onlyTitle = !color && !kmRaw && !priceRaw.trim();
      if (onlyTitle && !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(name)) {
        const upper = name.toUpperCase();
        if (!upper.startsWith("ACLARACION") && upper !== "MODELO") {
          section = name;
        }
      }
      continue;
    }

    const year = Number.parseInt(yearRaw, 10);
    if (!Number.isFinite(year) || year < 1950 || year > currentYear + 1) continue;

    const sectionKey = normalizeText(section);
    let brand = "";
    let model = name;
    if (!section || NON_BRAND_SECTIONS.has(sectionKey)) {
      const [first, ...rest] = name.split(" ");
      brand = first ?? "";
      model = rest.join(" ") || name;
    } else {
      brand = section;
      const lowered = normalizeText(name);
      const brandNorm = normalizeText(section);
      if (lowered.startsWith(`${brandNorm} `)) {
        model = name.split(" ").slice(1).join(" ");
      }
    }

    const price = parsePrice(priceRaw);
    const km = kmRaw ? Number.parseInt(kmRaw, 10) : null;

    const baseKey = [normalizeText(brand), normalizeText(model), year, km ?? ""].join("|");
    const count = (seen.get(baseKey) ?? 0) + 1;
    seen.set(baseKey, count);

    vehicles.push({
      key: count > 1 ? `${baseKey}#${count}` : baseKey,
      section,
      brand: tidyName(brand),
      model: tidyName(model),
      color: tidyName(color),
      year,
      km,
      priceLabel: price.label,
      priceUsd: price.usd,
    });
  }

  return vehicles;
}

/* ------------------------------ comparación ------------------------------ */

const webKm = (value: unknown) => {
  const d = digits(value);
  return d ? Number.parseInt(d, 10) : null;
};

const modelTokens = (model: string, knownBrands: Set<string>) =>
  normalizeText(model)
    .split(" ")
    .filter(Boolean)
    .filter((token, index) => !(index === 0 && knownBrands.has(token)));

const similarity = (a: string[], b: string[]) => {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const token of setA) if (setB.has(token)) shared += 1;
  const total = setA.size + setB.size - shared;
  return total === 0 ? 0 : shared / total;
};

/**
 * Cruza la planilla con la web. Un auto de la planilla coincide con uno de la
 * web cuando tienen el mismo año y la misma familia de modelo (primera palabra,
 * sin la marca) y, además, el mismo km o un nombre de modelo muy parecido.
 * Si todavía quedan sueltos, se acepta un km parecido (±15 %). Cada auto se
 * usa una sola vez y se prefieren siempre las coincidencias más fuertes.
 */
export function compareWithWeb<T extends WebVehicleLike>(
  sheet: SheetVehicle[],
  web: T[]
): SheetComparison<T> {
  const knownBrands = new Set<string>();
  for (const item of sheet) knownBrands.add(normalizeText(item.brand));
  for (const item of web) {
    const brand = normalizeText(item.marca).split(" ")[0];
    if (brand) knownBrands.add(brand);
  }

  const candidates = web.filter((vehicle) => vehicle.activo);
  const pool = candidates.map((vehicle) => ({
    vehicle,
    year: Number.parseInt(digits(vehicle.año), 10),
    km: webKm(vehicle.km),
    tokens: modelTokens(vehicle.modelo ?? vehicle.nombre ?? "", knownBrands),
    used: false,
  }));

  const sheetItems = sheet.map((item) => ({
    item,
    tokens: modelTokens(item.model, knownBrands),
    match: null as (typeof pool)[number] | null,
  }));

  const kmClose = (a: number | null, b: number | null) =>
    a != null && b != null && Math.abs(a - b) <= Math.max(a, b) * 0.15;

  const pair = (mode: "same-km" | "similar-name" | "loose") => {
    for (const entry of sheetItems) {
      if (entry.match) continue;
      let best: (typeof pool)[number] | null = null;
      let bestScore = -1;
      for (const candidate of pool) {
        if (candidate.used || candidate.year !== entry.item.year) continue;
        if (!entry.tokens.length || entry.tokens[0] !== candidate.tokens[0]) continue;
        const sameKm =
          entry.item.km != null && candidate.km != null && entry.item.km === candidate.km;
        const score = similarity(entry.tokens, candidate.tokens);
        const accepted =
          mode === "same-km"
            ? sameKm
            : mode === "similar-name"
              ? score >= 0.5
              : score >= 0.3 || kmClose(entry.item.km, candidate.km);
        if (!accepted) continue;
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      }
      if (best) {
        best.used = true;
        entry.match = best;
      }
    }
  };

  pair("same-km");
  pair("similar-name");
  pair("loose");

  return {
    added: sheetItems.filter((entry) => !entry.match).map((entry) => entry.item),
    removed: pool.filter((candidate) => !candidate.used).map((c) => c.vehicle),
    matched: sheetItems
      .filter((entry) => entry.match)
      .map((entry) => ({ sheet: entry.item, web: entry.match!.vehicle })),
  };
}
