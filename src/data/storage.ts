import { clearSession, getAuthHeaders } from "./auth";
import { publicStorageUrl, SUPABASE_URL } from "./supabase";

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
      headers: await getAuthHeaders({
        "Content-Type": contentType,
        "x-upsert": "true",
      }),
      body: blob,
    }
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("Sesión vencida. Volvé a iniciar sesión.");
  }

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

export const deleteFromStorage = async (
  bucket: string,
  paths: string[]
): Promise<void> => {
  if (!paths.length) return;
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}`,
    {
      method: "DELETE",
      headers: await getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ prefixes: paths }),
    }
  );

  if (response.status === 401) {
    clearSession();
    throw new Error("Sesión vencida. Volvé a iniciar sesión.");
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `No se pudieron eliminar los archivos de Storage (${response.status})${detail ? `: ${detail}` : ""}`
    );
  }
};
