import { useCallback, useEffect, useState } from "react";
import type { Car } from "./cars";
import { fetchVehicles, type VehicleCategory, type VehiclesResult } from "./vehicles";

type VehiclesState = {
  loading: boolean;
  error: string | null;
  cars: Car[];
  featured: Car | null;
  categories: VehicleCategory[];
};

let cache: VehiclesResult | null = null;
let inFlight: Promise<VehiclesResult> | null = null;

const emptyState: VehiclesState = {
  loading: true,
  error: null,
  cars: [],
  featured: null,
  categories: [],
};

export function useVehicles() {
  const [state, setState] = useState<VehiclesState>(() =>
    cache
      ? {
          loading: false,
          error: null,
          cars: cache.cars,
          featured: cache.featured,
          categories: cache.categories,
        }
      : emptyState
  );

  const load = useCallback(async (force = false) => {
    if (!force && cache) {
      setState({
        loading: false,
        error: null,
        cars: cache.cars,
        featured: cache.featured,
        categories: cache.categories,
      });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      inFlight = inFlight ?? fetchVehicles();
      const result = await inFlight;
      cache = result;
      setState({
        loading: false,
        error: null,
        cars: result.cars,
        featured: result.featured,
        categories: result.categories,
      });
    } catch {
      setState({
        loading: false,
        error:
          "No pudimos cargar el stock en vivo. Escribinos por WhatsApp y te pasamos la lista actualizada.",
        cars: [],
        featured: null,
        categories: [],
      });
    } finally {
      inFlight = null;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => {
    cache = null;
    void load(true);
  }, [load]);

  return { ...state, reload };
}
