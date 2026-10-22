import { heroPoster } from "../data/cars";
import type { HeroScene } from "../data/heroScenes";
import { canvasToBlob, uploadToStorage } from "../data/storage";
import {
  videoContentType,
  videoExtension,
  waitForMediaEvent,
} from "./storage";

const BUCKET = "stock-photos";
const HERO_FOLDER = "hero";
export const MAX_HERO_VIDEO_BYTES = 50 * 1024 * 1024;

/** Captures a frame from the uploaded video to use as its poster. */
const createPoster = async (file: File): Promise<Blob | null> => {
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
    return await canvasToBlob(canvas, "image/jpeg", 0.82);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
};

export async function uploadHeroVideo(file: File): Promise<HeroScene> {
  if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
    throw new Error("El archivo tiene que ser un video MP4, WebM o MOV.");
  }

  if (file.size > MAX_HERO_VIDEO_BYTES) {
    throw new Error("El video supera los 50 MB. Comprimilo antes de subirlo.");
  }

  const id = `hero_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const extension = videoExtension(file);
  const videoPath = `${HERO_FOLDER}/${id}${extension}`;

  const src = await uploadToStorage(
    BUCKET,
    videoPath,
    file,
    videoContentType(file, extension)
  );

  let poster = heroPoster;
  const posterBlob = await createPoster(file);
  if (posterBlob) {
    poster = await uploadToStorage(
      BUCKET,
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
