import { useCallback, useEffect, useState } from "react";
import { loadHeroScenes, type HeroScene } from "./heroScenes";

/**
 * Hero scenes saved from /admin. Starts empty so the hero shows only its
 * poster until Supabase answers; it never shows videos that are not in admin.
 */
export function useHeroScenes() {
  const [scenes, setScenes] = useState<HeroScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setScenes(await loadHeroScenes());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar los videos del hero."
      );
      setScenes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { scenes, loading, error, reload: load };
}
