import {
  publicStorageUrl,
  SUPABASE_URL,
  supabaseHeaders,
} from "./supabase";

export const uploadToStorage = async (
  bucket: string,
  path: string,
  blob: Blob,
  contentType: string
): Promise<string> => {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`,
    {
      method: "POST",
      headers: supabaseHeaders({
        "Content-Type": contentType,
        "x-upsert": "true",
      }),
      body: blob,
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `No se pudo subir el archivo (${response.status})${detail ? `: ${detail}` : ""}`
    );
  }

  return publicStorageUrl(bucket, path);
};

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
