import { FALLBACK_CAR_IMAGE, formatKm, formatPrice } from "../data/cars";
import { SUPABASE_URL, supabaseHeaders } from "../data/supabase";

export type AdminCategory = {
  id: string;
  slug: string;
  nombre: string;
  posicion: number | null;
};

export type AdminPhoto = {
  vehicle_id: string;
  url: string;
  posicion: number | null;
};

export type AdminVehicle = {
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
  version: string | null;
  transmision: string | null;
  combustible: string | null;
  carroceria: string | null;
  traccion: string | null;
  potencia: number | null;
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
  updated_at: string | null;
  photos: AdminPhoto[];
};

type RawAdminVehicle = Omit<AdminVehicle, "photos" | "potencia"> & {
  potencia?: number | string | null;
  photos?: never;
};

export type AdminStockResult = {
  vehicles: AdminVehicle[];
  categories: AdminCategory[];
  specsReady: boolean;
};

export type CreateDraftInput = {
  category: AdminCategory;
  brand: string;
  model: string;
  version: string;
  year: string;
  km: string;
  color: string;
  price: string;
  description: string;
};

const jsonHeaders = supabaseHeaders({ Accept: "application/json" });

const parseNumber = (value: string | null | undefined) => {
  const number = Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(number) ? number : null;
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "vehiculo";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        ...jsonHeaders,
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Supabase respondió ${response.status}${detail ? `: ${detail}` : ""}`
      );
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  } finally {
    window.clearTimeout(timer);
  }
};

export async function fetchAdminStock(): Promise<AdminStockResult> {
  const [rawVehicles, photos, categories] = await Promise.all([
    request<RawAdminVehicle[]>(
      "vehicles?select=*&order=created_at.desc"
    ),
    request<AdminPhoto[]>(
      "photos?select=vehicle_id,url,posicion&order=posicion.asc"
    ),
    request<AdminCategory[]>(
      "categories?select=id,slug,nombre,posicion&order=posicion.asc"
    ),
  ]);

  const specsReady =
    rawVehicles.length > 0 &&
    Object.prototype.hasOwnProperty.call(rawVehicles[0], "version");

  const photosByVehicle = new Map<string, AdminPhoto[]>();
  for (const photo of photos) {
    if (!photo.url) continue;
    const list = photosByVehicle.get(photo.vehicle_id) ?? [];
    list.push(photo);
    photosByVehicle.set(photo.vehicle_id, list);
  }

  const vehicles = rawVehicles.map((vehicle) => ({
    ...vehicle,
    potencia:
      typeof vehicle.potencia === "number"
        ? vehicle.potencia
        : parseNumber(vehicle.potencia),
    version: vehicle.version ?? null,
    transmision: vehicle.transmision ?? null,
    combustible: vehicle.combustible ?? null,
    carroceria: vehicle.carroceria ?? null,
    traccion: vehicle.traccion ?? null,
    photos: (photosByVehicle.get(vehicle.id) ?? []).sort(
      (a, b) => (a.posicion ?? 0) - (b.posicion ?? 0)
    ),
  }));

  return { vehicles, categories, specsReady };
}

export async function createVehicleDraft(
  input: CreateDraftInput
): Promise<AdminVehicle> {
  const brand = input.brand.trim();
  const model = input.model.trim();
  const version = input.version.trim();

  if (!brand || !model) {
    throw new Error("Marca y modelo son obligatorios.");
  }

  const name = [brand, model, version].filter(Boolean).join(" ").replace(/\s+/g, " ");
  const year = parseNumber(input.year);
  const km = parseNumber(input.km);
  const price = parseNumber(input.price);
  const category = input.category;

  const payload = {
    nombre: name,
    marca: brand,
    modelo: [model, version].filter(Boolean).join(" "),
    año: year,
    km: km == null ? null : formatKm(km),
    color: input.color.trim() || null,
    precio: price == null ? "Consultar" : formatPrice(price),
    precio_numero: price,
    descripcion: input.description.trim() || null,
    whatsapp_msg: null,
    destacado: false,
    activo: false,
    status: "borrador",
    condicion: category.slug === "0km" ? "0km" : "usado",
    tipo:
      category.slug === "motos"
        ? "moto"
        : category.slug === "patacletas"
          ? "patineta"
          : "auto",
    categoria: category.slug,
    seccion: category.slug,
    category_id: category.id,
    slug: `${slugify(name)}-${Date.now().toString(36).slice(-5)}`,
    updated_at: new Date().toISOString(),
  };

  const rows = await request<AdminVehicle[]>("vehicles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  const created = rows?.[0];
  if (!created) {
    throw new Error("No se pudo crear el borrador.");
  }

  return {
    ...created,
    version: version || null,
    transmision: null,
    combustible: null,
    carroceria: null,
    traccion: null,
    potencia: null,
    photos: [],
  };
}

export const categoryFor = (
  vehicle: AdminVehicle,
  categories: AdminCategory[]
) =>
  categories.find((category) => category.id === vehicle.category_id) ??
  categories.find((category) => category.slug === vehicle.categoria) ??
  null;

export const vehicleTitle = (vehicle: AdminVehicle) =>
  vehicle.nombre?.trim() ||
  [vehicle.marca, vehicle.modelo].filter(Boolean).join(" ") ||
  "Vehículo sin nombre";

export const vehicleCover = (vehicle: AdminVehicle) =>
  vehicle.photos[0]?.url || FALLBACK_CAR_IMAGE;

export const vehicleKm = (vehicle: AdminVehicle) => parseNumber(
  typeof vehicle.km === "number" ? String(vehicle.km) : vehicle.km
);

export const vehicleKmLabel = (vehicle: AdminVehicle) => {
  const km = vehicleKm(vehicle);
  return km == null ? "Consultar" : formatKm(km);
};

export const vehiclePriceLabel = (vehicle: AdminVehicle) => {
  if (vehicle.precio_numero != null) return formatPrice(vehicle.precio_numero);
  const label = vehicle.precio?.trim();
  if (label && label.toLowerCase() !== "consultar") return label;
  return "Consultar precio";
};

export const vehicleStatusLabel = (vehicle: AdminVehicle) =>
  vehicle.activo ? "Publicado" : "Borrador";

export const formatDateTime = (value: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
