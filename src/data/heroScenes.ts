import { loadAdminContent, saveAdminContent } from "./adminContent";
import { heroPoster, heroVideos } from "./cars";

export type HeroScene = {
  id: string;
  src: string;
  srcMobile?: string;
  poster?: string;
  label?: string;
  type?: "video" | "image";
  position?: string;
};

export const HERO_SCENES_KEY = "hero_scenes";

/** Local videos used when Supabase has no hero scenes yet. */
export const fallbackHeroScenes: HeroScene[] = heroVideos.map((src, index) => ({
  id: `fallback-${index + 1}`,
  src,
  srcMobile: src,
  poster: heroPoster,
  label: "",
  type: "video",
  position: "center",
}));

const normalizeScene = (raw: unknown, index: number): HeroScene | null => {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  if (typeof item.src !== "string" || !item.src.trim()) return null;

  const type = item.type === "image" ? "image" : "video";

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `scene-${index + 1}`,
    src: item.src,
    srcMobile:
      typeof item.srcMobile === "string" && item.srcMobile.trim()
        ? item.srcMobile
        : item.src,
    poster:
      typeof item.poster === "string" && item.poster.trim()
        ? item.poster
        : heroPoster,
    label: typeof item.label === "string" ? item.label : "",
    type,
    position:
      typeof item.position === "string" && item.position.trim()
        ? item.position
        : "center",
  };
};

const parseScenes = (data: unknown): HeroScene[] => {
  const list =
    Array.isArray(data) || data === null
      ? data
      : typeof data === "string"
        ? (JSON.parse(data) as unknown)
        : null;

  if (!Array.isArray(list)) return [];

  return list
    .map((item, index) => normalizeScene(item, index))
    .filter((item): item is HeroScene => item !== null);
};

/** Reads the hero scenes saved from /admin. Returns an empty array if none exist. */
export async function loadHeroScenes(): Promise<HeroScene[]> {
  return parseScenes(await loadAdminContent(HERO_SCENES_KEY));
}

export const heroScenesWithFallback = (scenes: HeroScene[]): HeroScene[] =>
  scenes.length ? scenes : fallbackHeroScenes;

/** Saves the scenes in admin_content.hero_scenes (creates the row if needed). */
export async function saveHeroScenes(scenes: HeroScene[]): Promise<void> {
  await saveAdminContent(HERO_SCENES_KEY, scenes);
}
