import { loadAdminContent, saveAdminContent } from "./adminContent";
import { images } from "./cars";

export type ShowroomStory = {
  id: string;
  src: string;
  poster?: string;
  label?: string;
  type: "image" | "video";
};

export const SHOWROOM_STORIES_KEY = "showroom_stories";

/** Placeholder stories shown until the admin uploads real ones. */
export const fallbackShowroomStories: ShowroomStory[] = [
  {
    id: "fallback-showroom",
    src: images.showroom,
    poster: images.showroom,
    label: "Showroom",
    type: "image",
  },
  {
    id: "fallback-lounge",
    src: images.lounge,
    poster: images.lounge,
    label: "Sala de espera",
    type: "image",
  },
];

const normalizeStory = (raw: unknown, index: number): ShowroomStory | null => {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  if (typeof item.src !== "string" || !item.src.trim()) return null;

  const type: ShowroomStory["type"] = item.type === "video" ? "video" : "image";

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `story-${index + 1}`,
    src: item.src,
    poster:
      typeof item.poster === "string" && item.poster.trim()
        ? item.poster
        : type === "image"
          ? item.src
          : images.showroom,
    label: typeof item.label === "string" ? item.label : "",
    type,
  };
};

const parseStories = (data: unknown): ShowroomStory[] => {
  const list =
    Array.isArray(data) || data === null
      ? data
      : typeof data === "string"
        ? (JSON.parse(data) as unknown)
        : null;

  if (!Array.isArray(list)) return [];

  return list
    .map((item, index) => normalizeStory(item, index))
    .filter((item): item is ShowroomStory => item !== null);
};

/** Reads the showroom stories saved from /admin. Returns an empty array if none exist. */
export async function loadShowroomStories(): Promise<ShowroomStory[]> {
  return parseStories(await loadAdminContent(SHOWROOM_STORIES_KEY));
}

export const showroomStoriesWithFallback = (
  stories: ShowroomStory[]
): ShowroomStory[] =>
  stories.length ? stories : fallbackShowroomStories;

export async function saveShowroomStories(
  stories: ShowroomStory[]
): Promise<void> {
  await saveAdminContent(SHOWROOM_STORIES_KEY, stories);
}
