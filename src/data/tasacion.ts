import { loadAdminContent, saveAdminContent } from "./adminContent";
import { canvasToBlob, uploadToStorage } from "./storage";

export const MAX_TASACION_PHOTOS = 6;
export const MAX_TASACION_PHOTO_BYTES = 12 * 1024 * 1024;
export const TASACION_MIN_YEAR = 2012;
export const TASACION_MAX_KM = 150000;
export const TASACION_PHOTO_MAX_DIMENSION = 1600;

const BUCKET = "stock-photos";
const FOLDER = "tasaciones";

export type TasacionRequest = {
  brand: string;
  model: string;
  year: string;
  km: string;
  photos: string[];
  createdAt: string;
};

const requestKey = (id: string) => `tasacion_${id}`;

export const createTasacionId = () => {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return random.toLowerCase().replace(/[^a-z0-9-]/g, "");
};

export const getTasacionIdFromPath = (pathname: string) => {
  const match = pathname.match(/^\/tasacion\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : "";
};

export const getTasacionGalleryUrl = (id: string) =>
  `${window.location.origin}/tasacion/${id}`;

const photoToWebp = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(
      1,
      TASACION_PHOTO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la foto.");

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/webp", 0.82);
    if (!blob || blob.type !== "image/webp") {
      throw new Error("El navegador no pudo optimizar la foto a WebP.");
    }

    return blob;
  } finally {
    bitmap.close();
  }
};

export async function uploadTasacionPhotos(
  id: string,
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  const photos: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    let webp: Blob;

    try {
      webp = await photoToWebp(files[index]);
    } catch {
      throw new Error(
        `No pudimos procesar ${files[index].name}. Probá con una foto JPG o PNG.`
      );
    }

    const path = `${FOLDER}/${id}/${String(index + 1).padStart(2, "0")}.webp`;
    const url = await uploadToStorage(BUCKET, path, webp, "image/webp");
    photos.push(url);
    onProgress?.(index + 1, files.length);
  }

  return photos;
}

export async function saveTasacionRequest(
  id: string,
  request: TasacionRequest
): Promise<void> {
  await saveAdminContent(requestKey(id), request);
}

const normalizeTasacionRequest = (data: unknown): TasacionRequest | null => {
  if (!data || typeof data !== "object") return null;

  const item = data as Record<string, unknown>;
  const photos = Array.isArray(item.photos)
    ? item.photos.filter(
        (photo): photo is string =>
          typeof photo === "string" && /^https?:\/\//i.test(photo)
      )
    : [];

  return {
    brand: typeof item.brand === "string" ? item.brand : "",
    model: typeof item.model === "string" ? item.model : "",
    year: typeof item.year === "string" ? item.year : "",
    km: typeof item.km === "string" ? item.km : String(item.km ?? ""),
    photos,
    createdAt:
      typeof item.createdAt === "string" ? item.createdAt : "",
  };
};

export async function loadTasacionRequest(
  id: string
): Promise<TasacionRequest | null> {
  return normalizeTasacionRequest(await loadAdminContent(requestKey(id)));
}
