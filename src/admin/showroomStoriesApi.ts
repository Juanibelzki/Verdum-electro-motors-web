import { images } from "../data/cars";
import type { ShowroomStory } from "../data/showroomStories";
import {
  canvasToBlob,
  uploadToStorage,
  videoContentType,
  videoExtension,
  waitForMediaEvent,
} from "./storage";

const BUCKET = "stock-photos";
const STORY_FOLDER = "showroom";
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

export const MAX_STORY_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_STORY_IMAGE_BYTES = 15 * 1024 * 1024;

const isImage = (file: File) =>
  file.type.startsWith("image/") || /\.(jpe?g|png|webp|avif)$/i.test(file.name);

const isVideo = (file: File) =>
  file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

const drawCenterCrop = (
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = sourceWidth / sourceHeight;

  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  context.drawImage(
    source,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    targetWidth,
    targetHeight
  );
};

const imageToWebp = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = STORY_WIDTH;
    canvas.height = STORY_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen.");

    drawCenterCrop(
      context,
      bitmap,
      bitmap.width,
      bitmap.height,
      STORY_WIDTH,
      STORY_HEIGHT
    );

    const blob = await canvasToBlob(canvas, "image/webp", 0.85);
    if (!blob || blob.type !== "image/webp") {
      throw new Error("El navegador no pudo convertir la imagen a WebP.");
    }

    return blob;
  } finally {
    bitmap.close();
  }
};

const videoToWebpPoster = async (file: File): Promise<Blob | null> => {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await waitForMediaEvent(video, "loadedmetadata");
    const duration = Number.isFinite(video.duration) ? video.duration : 1;
    video.currentTime = Math.min(Math.max(duration * 0.12, 0.35), 3);
    await waitForMediaEvent(video, "seeked");

    if (!video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;

    const context = canvas.getContext("2d");
    if (!context) return null;

    drawCenterCrop(
      context,
      video,
      video.videoWidth,
      video.videoHeight,
      720,
      1280
    );

    const blob = await canvasToBlob(canvas, "image/webp", 0.82);
    return blob?.type === "image/webp" ? blob : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
};

const uploadStoryImage = async (file: File): Promise<ShowroomStory> => {
  if (file.size > MAX_STORY_IMAGE_BYTES) {
    throw new Error("La imagen supera los 15 MB.");
  }

  const id = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const webp = await imageToWebp(file);
  const src = await uploadToStorage(
    BUCKET,
    `${STORY_FOLDER}/${id}.webp`,
    webp,
    "image/webp"
  );

  return {
    id,
    src,
    poster: src,
    label: file.name.replace(/\.[^.]+$/, ""),
    type: "image",
  };
};

const uploadStoryVideo = async (file: File): Promise<ShowroomStory> => {
  if (file.size > MAX_STORY_VIDEO_BYTES) {
    throw new Error("El video supera los 50 MB.");
  }

  const id = `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const extension = videoExtension(file);
  const src = await uploadToStorage(
    BUCKET,
    `${STORY_FOLDER}/${id}${extension}`,
    file,
    videoContentType(file, extension)
  );

  let poster = images.showroom;
  const posterBlob = await videoToWebpPoster(file);
  if (posterBlob) {
    poster = await uploadToStorage(
      BUCKET,
      `${STORY_FOLDER}/${id}_poster.webp`,
      posterBlob,
      "image/webp"
    );
  }

  return {
    id,
    src,
    poster,
    label: file.name.replace(/\.[^.]+$/, ""),
    type: "video",
  };
};

export async function uploadShowroomStory(file: File): Promise<ShowroomStory> {
  if (isImage(file)) return uploadStoryImage(file);
  if (isVideo(file)) return uploadStoryVideo(file);
  throw new Error("El archivo tiene que ser una imagen o un video.");
}
