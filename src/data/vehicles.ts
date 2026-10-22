import { FALLBACK_CAR_IMAGE, formatPrice, type Car } from "./cars";
import { SUPABASE_URL, supabaseHeaders } from "./supabase";

export type VehicleCategory = {
  id: string;
  slug: string;
  nombre: string;
  shortName: string;
  count: number;
};

export type VehiclesResult = {
  cars: Car[];
  featured: Car | null;
  categories: VehicleCategory[];
};

type RawVehicle = {
  id: string;
  slug: string | null;
  nombre: string | null;
  marca: string | null;
  modelo: string | null;
  año: number | string | null;
  km: number | string | null;
  color: string | null;
  precio: string | null;
  precio_numero: number | null;
  version?: string | null;
  transmision?: string | null;
  combustible?: string | null;
  carroceria?: string | null;
  traccion?: string | null;
  potencia?: number | string | null;
  descripcion: string | null;
  whatsapp_msg: string | null;
  destacado: boolean | null;
  activo: boolean;
  status: string | null;
  condicion: string | null;
  tipo: string | null;
  categoria: string | null;
  seccion: string | null;
  category_id: string | null;
  created_at: string | null;
};

type RawPhoto = {
  vehicle_id: string;
  url: string;
  posicion: number | null;
};

type RawCategory = {
  id: string;
  slug: string;
  nombre: string;
  posicion: number | null;
};

const BRANDS = [
  "Mercedes-Benz",
  "Volkswagen",
  "Chevrolet",
  "Peugeot",
  "Citroën",
  "Mitsubishi",
  "Land Rover",
  "Alfa Romeo",
  "Toyota",
  "Nissan",
  "Renault",
  "Honda",
  "Hyundai",
  "Suzuki",
  "Subaru",
  "Porsche",
  "Isuzu",
  "Chery",
  "Fiat",
  "Ford",
  "Jeep",
  "Kia",
  "Ram",
  "BMW",
  "Audi",
  "Volvo",
  "Mini",
  "JAC",
  "DS",
];

const MODEL_BRANDS: Record<string, string> = {
  ECOSPORT: "Ford",
  KA: "Ford",
  CARGO: "Ford",
  RANGER: "Ford",
  RAPTOR: "Ford",
  "F-150": "Ford",
  TERRITORY: "Ford",
  HILUX: "Toyota",
  SW4: "Toyota",
  COROLLA: "Toyota",
  YARIS: "Toyota",
  ETIOS: "Toyota",
  AMAROK: "Volkswagen",
  GOL: "Volkswagen",
  TAOS: "Volkswagen",
  VENTO: "Volkswagen",
  POLO: "Volkswagen",
  ARGO: "Fiat",
  CRONOS: "Fiat",
  PALIO: "Fiat",
  UNO: "Fiat",
  MOBI: "Fiat",
  FIORINO: "Fiat",
  FRONTIER: "Nissan",
  RAMPAGE: "Ram",
  TRACKER: "Chevrolet",
  ONIX: "Chevrolet",
  S10: "Chevrolet",
  "2008": "Peugeot",
  "207": "Peugeot",
  "208": "Peugeot",
  "3008": "Peugeot",
};

const KEEP_UPPER = new Set([
  "AT",
  "MT",
  "AM",
  "CVT",
  "DSG",
  "PDK",
  "TSI",
  "TDI",
  "TFSI",
  "BITDI",
  "V6",
  "V8",
  "V12",
  "4X4",
  "4X2",
  "4WD",
  "AWD",
  "FWD",
  "RWD",
  "SUV",
  "0KM",
  "4MATIC",
  "4MOTION",
  "AMG",
  "GT",
  "GTI",
  "GLI",
  "GL",
  "GSE",
  "XEI",
  "XLS",
  "SRX",
  "SRV",
  "SEG",
  "GR",
  "HP",
  "CV",
  "USB",
  "LED",
  "GPS",
  "ABS",
  "EBD",
  "VSC",
  "TRC",
  "ISOFIX",
  "TM",
  "TMANUAL",
]);

const CATEGORY_SHORT: Record<string, string> = {
  "0km": "0KM",
  usados: "Usados",
  especiales: "Especiales",
  motos: "Motos",
  patacletas: "Patinetas",
};

const CATEGORY_ORDER = ["0km", "usados", "especiales", "motos", "patacletas"];

const headers = supabaseHeaders({ Accept: "application/json" });

async function rest<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Supabase respondió ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

function smartWord(word: string) {
  const letters = word.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  if (!letters) return word;

  const hasUpper = /[A-ZÁÉÍÓÚÑ]/.test(letters);
  const hasLower = /[a-záéíóúñ]/.test(letters);

  if (hasUpper && hasLower) return word;
  if (KEEP_UPPER.has(letters.toUpperCase())) return word.toUpperCase();
  if (/\d/.test(word)) return word;
  if (hasUpper) {
    const lower = word.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function smartTitle(input: string) {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(smartWord)
    .join(" ");
}

function dedupeRepeated(input: string) {
  const words = input.replace(/\s+/g, " ").trim().split(" ");
  for (let start = 0; start < words.length; start += 1) {
    const rest = words.slice(start);
    if (rest.length < 2 || rest.length % 2 !== 0) continue;
    const half = rest.length / 2;
    const first = rest.slice(0, half).join(" ").toLowerCase();
    const second = rest.slice(half).join(" ").toLowerCase();
    if (first === second) {
      return [...words.slice(0, start), ...rest.slice(0, half)].join(" ");
    }
  }
  return words.join(" ");
}

function findBrand(text: string) {
  const lower = text.trim().toLowerCase();
  return BRANDS.find((brand) => lower.startsWith(brand.toLowerCase())) ?? null;
}

function resolveBrand(raw: RawVehicle) {
  const candidates = [raw.marca, raw.modelo, raw.nombre].filter(
    (value): value is string => Boolean(value && value.trim())
  );

  for (const candidate of candidates) {
    const brand = findBrand(candidate);
    if (brand) return brand;
  }

  for (const candidate of candidates) {
    const first = candidate
      .trim()
      .split(/\s+/)[0]
      ?.replace(/[^A-Za-z0-9-]/g, "")
      .toUpperCase();
    if (first && MODEL_BRANDS[first]) return MODEL_BRANDS[first];
  }

  const fallback = (raw.marca || raw.nombre || "Otra").trim().split(/\s+/)[0];
  return smartTitle(fallback);
}

function modelFromTitle(title: string, brand: string) {
  let model = title;
  if (brand && title.toLowerCase().startsWith(brand.toLowerCase())) {
    model = title.slice(brand.length).trim();
  }
  model = dedupeRepeated(model);
  return model || title;
}

function parseYear(value: RawVehicle["año"]): number | null {
  const number =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(number)) return null;
  const max = new Date().getFullYear() + 1;
  return number >= 1950 && number <= max ? number : null;
}

function parseKm(value: RawVehicle["km"]): number | null {
  const number =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(number) || number < 0 || number > 2_000_000) return null;
  return number;
}

function parsePrice(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function inferTransmission(text: string) {
  const lower = text.toLowerCase();
  if (/\bcvt\b/.test(lower)) return "Automática (CVT)";
  if (/\b(dsg|pdk)\b/.test(lower)) return "Automática";
  if (/\b(at|aut|am|autom[áa]tico|autom[áa]tica)\b/.test(lower)) return "Automática";
  if (/\b(mt|tm|t\/m|manual)\b/.test(lower)) return "Manual";
  return "Consultar";
}

function inferFuel(text: string) {
  const lower = text.toLowerCase();
  if (/\b(el[ée]ctrico|electrico|ev|bev)\b/.test(lower)) return "Eléctrico";
  if (/\b(h[íi]brido|hibrido|hibri|hev|phev)\b/.test(lower)) return "Híbrido";
  if (/\b(di[ée]sel|diesel|tdi|bitdi|hdi|bluetec)\b/.test(lower)) return "Diésel";
  if (/\b(nafta|gasolina|ecoboost|tsi|tfsi)\b/.test(lower)) return "Nafta";
  return "Consultar";
}

function inferBody(text: string) {
  const lower = text.toLowerCase();
  if (/(cargo|furg[oó]n|utilitario|\bvan\b)/.test(lower)) return "Utilitario";
  if (
    /(pick-?up|amarok|ranger|hilux|frontier|f-150|raptor|s10|rampage|saveiro|strada|toro)/.test(
      lower
    )
  ) {
    return "Pick-up";
  }
  if (
    /(suv|sw4|corolla cross|tracker|territory|ecosport|2008|taos|t-cross|tiguan|kicks|creta)/.test(
      lower
    )
  ) {
    return "SUV";
  }
  if (/(sed[áa]n|corolla|vento|cronos|logue|city|accord|civic)/.test(lower)) return "Sedán";
  if (
    /(hatch|gol|\bka\b|\buno\b|palio|argo|207|208|onix|polo|fox|up!|mobi|sandero|clio|yaris)/.test(
      lower
    )
  ) {
    return "Hatchback";
  }
  return "Auto";
}

function inferDrive(text: string) {
  const lower = text.toLowerCase();
  if (/\b(4x4|awd|4wd|4matic|4motion)\b/.test(lower)) return "4x4";
  if (/\b(4x2)\b/.test(lower)) return "4x2";
  if (/\b(delantera|fwd)\b/.test(lower)) return "Delantera";
  if (/\b(trasera|rwd)\b/.test(lower)) return "Trasera";
  return "Consultar";
}

function inferPower(text: string) {
  const match = text.match(/(\d{2,4})\s*(?:cv|hp)\b/i);
  return match ? Number(match[1]) : null;
}

function parsePower(value: RawVehicle["potencia"]): number | null {
  const number =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function cleanSpec(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function inferColor(rawColor: string | null, text: string) {
  const color = (rawColor ?? "").trim();
  if (color) return smartTitle(color);

  const colors = [
    "GRIS OSCURO",
    "GRIS PLATA",
    "BLANCO",
    "BLANCA",
    "NEGRO",
    "NEGRA",
    "GRIS",
    "ROJO",
    "ROJA",
    "AZUL",
    "BEIGE",
    "VERDE",
    "AMARILLO",
    "PLATA",
    "BORDEAUX",
    "MARRÓN",
    "MARRON",
  ];
  const upper = text.toUpperCase();
  const found = colors.find((item) => upper.includes(item));
  return found ? smartTitle(found) : "Consultar";
}

function parseDescription(raw: string | null) {
  const text = (raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return { description: "", features: [] as string[], tagline: "" };

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const features: string[] = [];
  const prose: string[] = [];

  for (const line of lines) {
    const bullet = line.match(/^([•\-*✔✅▪·]|\d+[.)])\s*(.+)$/);
    if (bullet) {
      const content = bullet[2].trim();
      if (content.length > 1) features.push(content);
    } else if (features.length === 0) {
      prose.push(line);
    }
  }

  const description = prose.join("\n\n").trim();
  const firstFeature = features[0]?.replace(/\s+/g, " ").trim() ?? "";
  const source = description || firstFeature;
  const tagline = source ? source.split(/(?<=[.!?])\s/)[0].slice(0, 170) : "";

  return {
    description,
    features: Array.from(new Set(features)).slice(0, 40),
    tagline,
  };
}

function conditionFrom(categorySlug: string, rawCondition: string | null) {
  if (categorySlug === "0km") return "0KM";
  if (categorySlug === "usados") return "Usado";
  const condition = (rawCondition ?? "").toLowerCase();
  if (condition.includes("0") || condition.includes("nuevo")) return "0KM";
  if (condition.includes("usado") || condition.includes("semi")) return "Usado";
  return "Consultar";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeVehicle(
  raw: RawVehicle,
  category: RawCategory | undefined,
  photos: string[]
): Car {
  const title = smartTitle(dedupeRepeated(raw.nombre || `${raw.marca ?? ""} ${raw.modelo ?? ""}`));
  const brand = resolveBrand(raw);
  const model = modelFromTitle(title, brand);
  const year = parseYear(raw.año);
  const km = parseKm(raw.km);
  const price = parsePrice(raw.precio_numero);
  const categorySlug = category?.slug ?? slugify(raw.categoria ?? "sin-categoria");
  const categoryName = category?.nombre ?? raw.categoria ?? "Sin categoría";
  const condition = conditionFrom(categorySlug, raw.condicion);
  const fullText = `${title} ${raw.descripcion ?? ""}`;
  const transmission =
    cleanSpec(raw.transmision) || inferTransmission(fullText);
  const fuel = cleanSpec(raw.combustible) || inferFuel(fullText);
  const body = cleanSpec(raw.carroceria) || inferBody(fullText);
  const drive = cleanSpec(raw.traccion) || inferDrive(fullText);
  const power = parsePower(raw.potencia) ?? inferPower(fullText);
  const color = inferColor(raw.color, title);
  const parsed = parseDescription(raw.descripcion);
  const tagline =
    parsed.tagline ||
    [condition, year ? String(year) : null, body].filter(Boolean).join(" · ");
  const explicitVersion = cleanSpec(raw.version);
  const version =
    explicitVersion ||
    [body, drive !== "Consultar" ? drive : null].filter(Boolean).join(" · ") ||
    categoryName;
  const whatsappMsg =
    (raw.whatsapp_msg ?? "").trim() ||
    `¡Hola! Quiero consultar el precio y disponibilidad del ${title}${
      year ? ` (${year})` : ""
    } que vi en su web.`;

  return {
    id: raw.id,
    slug: raw.slug ?? slugify(title),
    title,
    brand,
    model,
    version,
    year,
    km,
    transmission,
    fuel,
    body,
    drive,
    power,
    color,
    condition,
    category: categoryName,
    categorySlug,
    categoryId: category?.id ?? raw.category_id ?? "sin-categoria",
    price,
    priceLabel: formatPrice(price),
    image: photos[0] ?? FALLBACK_CAR_IMAGE,
    photos: photos.length > 0 ? photos : [FALLBACK_CAR_IMAGE],
    badge: condition === "0KM" ? "0 KM" : "Usado",
    description: parsed.description,
    tagline,
    features: parsed.features,
    whatsappMsg,
    featured: Boolean(raw.destacado),
  };
}

export async function fetchVehicles(): Promise<VehiclesResult> {
  const [vehicles, photos, categories] = await Promise.all([
    rest<RawVehicle[]>("vehicles?select=*&activo=eq.true&order=created_at.desc"),
    rest<RawPhoto[]>("photos?select=vehicle_id,url,posicion&order=posicion.asc"),
    rest<RawCategory[]>("categories?select=id,slug,nombre,posicion&order=posicion.asc"),
  ]);

  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const photosByVehicle = new Map<string, RawPhoto[]>();

  for (const photo of photos) {
    if (!photo.url) continue;
    const list = photosByVehicle.get(photo.vehicle_id) ?? [];
    list.push(photo);
    photosByVehicle.set(photo.vehicle_id, list);
  }

  const normalized = vehicles.map((vehicle) => {
    const vehiclePhotos = (photosByVehicle.get(vehicle.id) ?? [])
      .sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0))
      .map((photo) => photo.url);
    return normalizeVehicle(
      vehicle,
      vehicle.category_id ? categoriesById.get(vehicle.category_id) : undefined,
      vehiclePhotos
    );
  });

  const markedFeatured = normalized.find((car) => car.featured);
  const zeroKm = normalized.filter((car) => car.categorySlug === "0km");
  const featured =
    markedFeatured ??
    [...zeroKm].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ??
    normalized[0] ??
    null;

  const cars = normalized.map((car) =>
    car.id === featured?.id
      ? { ...car, featured: true, badge: "Destacado" }
      : { ...car, featured: false }
  );

  const counts = new Map<string, number>();
  for (const car of cars) {
    counts.set(car.categoryId, (counts.get(car.categoryId) ?? 0) + 1);
  }

  const vehicleCategories = categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      nombre: category.nombre,
      shortName: CATEGORY_SHORT[category.slug] ?? category.nombre,
      count: counts.get(category.id) ?? 0,
    }))
    .filter((category) => category.count > 0)
    .sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug) ||
        a.nombre.localeCompare(b.nombre, "es")
    );

  return {
    cars,
    featured: cars.find((car) => car.id === featured?.id) ?? null,
    categories: vehicleCategories,
  };
}
