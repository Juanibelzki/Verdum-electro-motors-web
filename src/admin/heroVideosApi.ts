import { heroPoster } from "../data/cars";
import type { HeroScene } from "../data/heroScenes";
import { publicStorageUrl, SUPABASE_URL, supabaseHeaders } from "../data/supabase";

const BUCKET = "stock-photos";
const HERO_FOLDER = "hero";
export const MAX_HERO_VIDEO_BYTES = 50 * 1024 * 1024;

const extensionFor = (file: File) => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".webm")) return ".webm";
  if (name.endsWith(".mov")) return ".mov";
  if (name.endsWith(".m4v")) return ".m4v";
  return ".mp4";
};

const contentTypeFor = (file: File, extension: string) => {
  if (file.type) return file.type;
  if (extension === ".webm") return "video/webm";
  if (extension === ".mov") return "video/quicktime";
  return "video/mp4";
};

const waitForEvent = (
  target: HTMLMediaElement,
  event: "loadedmetadata" | "seeked",
  timeout = 10000
) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("El video tardó demasiado en cargar."));
    }, timeout);

    const cleanup = () => {
      window.clearTimeout(timer);
      target.removeEventListener(event, onEvent);
    };

    const onEvent = () => {
      cleanup();
      resolve();
    };

    target.addEventListener(event, onEvent, { once: true });
  });

/** Captures a frame from the uploaded video to use as its poster. */
const createPoster = async (file: File): Promise<Blob | null> => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await waitForEvent(video, "loadedmetadata");
    const duration = Number.isFinite(video.duration) ? video.duration : 1;
    video.currentTime = Math.min(Math.max(duration * 0.12, 0.35), 3);
    await waitForEvent(video, "seeked");

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const canvas = document.createElement("canvas");
    const targetWidth = Math.min(width, 1280);
    canvas.width = targetWidth;
    canvas.height = Math.round((targetWidth / width) * height);

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
};

const uploadBlob = async (
  path: string,
  blob: Blob,
  contentType: string
): Promise<string> => {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodedPath}`,
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

  return publicStorageUrl(BUCKET, path);
};

export async function uploadHeroVideo(file: File): Promise<HeroScene> {
  if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
    throw new Error("El archivo tiene que ser un video MP4, WebM o MOV.");
  }

  if (file.size > MAX_HERO_VIDEO_BYTES) {
    throw new Error("El video supera los 50 MB. Comprimilo antes de subirlo.");
  }

  const id = `hero_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const extension = extensionFor(file);
  const videoPath = `${HERO_FOLDER}/${id}${extension}`;

  const src = await uploadBlob(
    videoPath,
    file,
    contentTypeFor(file, extension)
  );

  let poster = heroPoster;
  const posterBlob = await createPoster(file);
  if (posterBlob) {
    poster = await uploadBlob(
      `${HERO_FOLDER}/${id}_poster.jpg`,
      posterBlob,
      "image/jpeg"
    );
  }

  return {
    id,
    src,
    srcMobile: src,
    poster,
    label: file.name.replace(/\.[^.]+$/, ""),
    type: "video",
    position: "center",
  };
}
