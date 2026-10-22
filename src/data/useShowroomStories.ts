import { useCallback, useEffect, useState } from "react";
import {
  fallbackShowroomStories,
  loadShowroomStories,
  showroomStoriesWithFallback,
  type ShowroomStory,
} from "./showroomStories";

export function useShowroomStories() {
  const [stories, setStories] = useState<ShowroomStory[]>(
    fallbackShowroomStories
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const current = await loadShowroomStories();
      setStories(showroomStoriesWithFallback(current));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar las historias del showroom."
      );
      setStories(fallbackShowroomStories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { stories, loading, error, reload: load };
}
