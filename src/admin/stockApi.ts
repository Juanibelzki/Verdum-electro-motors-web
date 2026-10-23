import { clearSession, getAuthHeaders } from "../data/auth";
import { FALLBACK_CAR_IMAGE, formatKm, formatPrice } from "../data/cars";
import { canvasToBlob, uploadToStorage } from "../data/storage";
import { SUPABASE_URL } from "../data/supabase";

export const MAX_VEHICLE_PHOTOS = 8;
export const MAX_VEHICLE_PHOTO_BYTES = 15 * 1024 * 1024;

export type AdminCategory = {
  id: string;
  slug: string;
  nombre: string;
  posicion: number | null;
};

export type AdminPhoto = {
  id: string;
  vehicle_id: string;
  url: string;
  url_thumb: string | null;
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

export type VehicleFormInput = {
  category: AdminCategory;
  nombre: string;
  marca: string;
  modelo: string;
  version: string;
  año: string;
  km: string;
  color: string;
  precio: string;
  descripcion: string;
  whatsappMsg: string;
  transmision: string;
  combustible: string;
  carroceria: string;
  traccion: string;
  potencia: string;
  destacado: boolean;
  activo: boolean;
  specsReady: boolean;
};

export type VehiclePhotoUpload = {
  file: File;
  position: number;
};

export type VehiclePhotoInsert = {
  url: string;
  position: number;
};

export type VehiclePhotoPosition = {
  id: string;
  position: number;
};

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
  const timer = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: await getAuthHeaders({
        Accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearSession();
      throw new Error("Sesión vencida. Volvé a iniciar sesión.");
    }

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
      "photos?select=id,vehicle_id,url,url_thumb,posicion&order=posicion.asc"
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

const vehicleType = (category: AdminCategory) =>
  category.slug === "motos"
    ? "moto"
    : category.slug === "patacletas"
      ? "patineta"
      : "auto";

export async function saveVehicle(
  input: VehicleFormInput,
  id: string,
  isNew: boolean
): Promise<AdminVehicle> {
  const brand = input.marca.trim();
  const model = input.modelo.trim();
  const version = input.version.trim();

  if (!input.category) {
    throw new Error("Elegí una categoría.");
  }
  if (!brand || !model) {
    throw new Error("Marca y modelo son obligatorios.");
  }

  const year = parseNumber(input.año);
  if (
    input.año.trim() &&
    (year == null || year < 1950 || year > new Date().getFullYear() + 1)
  ) {
    throw new Error("El año no parece válido.");
  }

  const km = parseNumber(input.km);
  const price = parseNumber(input.precio);
  if (input.precio.trim() && (price == null || price <= 0)) {
    throw new Error("El precio tiene que ser un número mayor a cero.");
  }

  const power = parseNumber(input.potencia);
  if (
    input.specsReady &&
    input.potencia.trim() &&
    (power == null || power <= 0)
  ) {
    throw new Error("La potencia tiene que ser un número mayor a cero.");
  }

  const modelWithVersion =
    version && !model.toLowerCase().includes(version.toLowerCase())
      ? `${model} ${version}`
      : model;
  const name =
    input.nombre.trim() ||
    [brand, modelWithVersion].filter(Boolean).join(" ").replace(/\s+/g, " ");

  const payload: Record<string, unknown> = {
    nombre: name,
    marca: brand,
    modelo: modelWithVersion,
    año: year,
    km: km == null ? null : formatKm(km),
    color: input.color.trim() || null,
    precio: price == null ? "Consultar" : formatPrice(price),
    precio_numero: price,
    descripcion: input.descripcion.trim() || null,
    whatsapp_msg: input.whatsappMsg.trim() || null,
    destacado: input.destacado,
    activo: input.activo,
    status: input.activo ? "publicado" : "borrador",
    condicion: input.category.slug === "0km" ? "0km" : "usado",
    tipo: vehicleType(input.category),
    categoria: input.category.slug,
    seccion: input.category.slug,
    category_id: input.category.id,
    updated_at: new Date().toISOString(),
  };

  if (input.specsReady) {
    payload.version = version || null;
    payload.transmision = input.transmision.trim() || null;
    payload.combustible = input.combustible.trim() || null;
    payload.carroceria = input.carroceria.trim() || null;
    payload.traccion = input.traccion.trim() || null;
    payload.potencia = power;
  }

  if (isNew) {
    payload.id = id;
    payload.slug = `${slugify(name)}-${Date.now().toString(36).slice(-5)}`;
  }

  const rows = await request<AdminVehicle[]>(
    isNew ? "vehicles" : `vehicles?id=eq.${encodeURIComponent(id)}`,
    {
      method: isNew ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );

  const saved = rows?.[0];
  if (!saved) {
    throw new Error("No se pudo guardar el vehículo.");
  }

  if (input.destacado) {
    await request<unknown>(
      `vehicles?destacado=eq.true&id=neq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ destacado: false }),
      }
    );
  }

  return {
    ...saved,
    version: saved.version ?? (input.specsReady ? version || null : null),
    transmision: saved.transmision ?? null,
    combustible: saved.combustible ?? null,
    carroceria: saved.carroceria ?? null,
    traccion: saved.traccion ?? null,
    potencia:
      saved.potencia == null ? null : parseNumber(String(saved.potencia)),
    photos: [],
  };
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("No se pudo leer la imagen. Probá con JPG, PNG o WebP."));
    image.src = src;
  });

const fileToWebp = async (file: File): Promise<Blob> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo tiene que ser una imagen.");
  }
  if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
    throw new Error("La foto supera los 15 MB. Comprimila antes de subirla.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) throw new Error("La imagen no tiene dimensiones válidas.");

    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas, "image/webp", 0.82);
    if (!blob) throw new Error("No se pudo convertir la imagen a WebP.");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export async function uploadVehiclePhoto(
  file: File,
  vehicleId: string,
  index: number
): Promise<string> {
  const blob = await fileToWebp(file);
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `vehicles/${vehicleId}/${index}_${suffix}.webp`;
  return uploadToStorage("stock-photos", path, blob, "image/webp");
}

export async function insertVehiclePhotos(
  vehicleId: string,
  photos: VehiclePhotoInsert[]
): Promise<void> {
  if (!photos.length) return;

  await request<unknown>("photos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(
      photos.map((photo) => ({
        vehicle_id: vehicleId,
        url: photo.url,
        url_thumb: photo.url,
        posicion: photo.position,
      }))
    ),
  });
}

export async function updateVehiclePhotoPositions(
  photos: VehiclePhotoPosition[]
): Promise<void> {
  await Promise.all(
    photos.map((photo) =>
      request<unknown>(`photos?id=eq.${encodeURIComponent(photo.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ posicion: photo.position }),
      })
    )
  );
}

export async function deleteVehiclePhoto(id: string): Promise<void> {
  await request<unknown>(`photos?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
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

export const vehicleStatusLabel = (vehicle: AdminVehicle) => {
  if (!vehicle.activo) return "Borrador";
  if (vehicle.status === "pendiente_fotos") return "Pendiente de fotos";
  if (vehicle.status === "borrador") return "Borrador";
  return "Publicado";
};

export const formatDateTime = (value: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
