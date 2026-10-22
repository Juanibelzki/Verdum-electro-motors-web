import { heroPoster, heroVideos } from "./cars";
import { SUPABASE_URL, supabaseHeaders } from "./supabase";

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
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_content?select=data&key=eq.${HERO_SCENES_KEY}`,
      {
        headers: supabaseHeaders({ Accept: "application/json" }),
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase respondió ${response.status}`);
    }

    const rows = (await response.json()) as Array<{ data?: unknown }>;
    return parseScenes(rows?.[0]?.data);
  } finally {
    window.clearTimeout(timer);
  }
}

export const heroScenesWithFallback = (scenes: HeroScene[]): HeroScene[] =>
  scenes.length ? scenes : fallbackHeroScenes;

/** Saves the scenes in admin_content.hero_scenes (creates the row if needed). */
export async function saveHeroScenes(scenes: HeroScene[]): Promise<void> {
  const headers = supabaseHeaders({
    "Content-Type": "application/json",
    Accept: "application/json",
    Prefer: "return=representation",
  });

  const patch = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_content?key=eq.${HERO_SCENES_KEY}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ data: scenes }),
    }
  );

  if (!patch.ok) {
    throw new Error(`No se pudo guardar el hero (${patch.status}).`);
  }

  const body = await patch.text();
  const updated = body ? (JSON.parse(body) as unknown[]) : [];

  if (Array.isArray(updated) && updated.length > 0) return;

  const insert = await fetch(`${SUPABASE_URL}/rest/v1/admin_content`, {
    method: "POST",
    headers,
    body: JSON.stringify({ key: HERO_SCENES_KEY, data: scenes }),
  });

  if (!insert.ok) {
    throw new Error(`No se pudo crear la configuración del hero (${insert.status}).`);
  }
}
