import {
  publicStorageUrl,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "./supabase";

const BUCKET = "stock-photos";
const MAX_SIDE = 1600;
const WEBP_QUALITY = 0.8;

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`No pudimos leer ${file.name}.`));
    };
    image.src = objectUrl;
  });

const fileToWebp = async (file: File): Promise<Blob> => {
  const image = await loadImage(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) {
    throw new Error(`La imagen ${file.name} no tiene dimensiones válidas.`);
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No pudimos procesar la imagen.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
  );

  if (!blob) {
    throw new Error(`No pudimos convertir ${file.name} a WebP.`);
  }

  return blob;
};

const encodePath = (path: string) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const uploadWebp = async (path: string, blob: Blob): Promise<string> => {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodePath(path)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "image/webp",
        "cache-control": "31536000",
      },
      body: blob,
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `No pudimos subir las fotos (${response.status})${
        detail ? `. ${detail}` : "."
      }`
    );
  }

  return publicStorageUrl(BUCKET, path);
};

/**
 * Optimizes the selected photos to WebP and uploads them to the public
 * stock-photos bucket under tasaciones/<batch>/. Returns their public URLs.
 */
export async function uploadTasacionPhotos(
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  if (!files.length) return [];

  const batch = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const urls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const blob = await fileToWebp(file);
    const suffix = Math.random().toString(36).slice(2, 8);
    const path = `tasaciones/${batch}/${String(index + 1).padStart(
      2,
      "0"
    )}_${suffix}.webp`;

    urls.push(await uploadWebp(path, blob));
    onProgress?.(index + 1, files.length);
  }

  return urls;
}
