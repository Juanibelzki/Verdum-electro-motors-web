import { useCallback, useEffect, useState } from "react";
import {
  fallbackHeroScenes,
  heroScenesWithFallback,
  loadHeroScenes,
  type HeroScene,
} from "./heroScenes";

export function useHeroScenes() {
  const [scenes, setScenes] = useState<HeroScene[]>(fallbackHeroScenes);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const current = await loadHeroScenes();
      setScenes(heroScenesWithFallback(current));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar los videos del hero."
      );
      setScenes(fallbackHeroScenes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { scenes, loading, error, reload: load };
}
