import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminStock,
  type AdminCategory,
  type AdminVehicle,
} from "./stockApi";

export type AdminStockState = {
  vehicles: AdminVehicle[];
  categories: AdminCategory[];
  specsReady: boolean;
  loading: boolean;
  error: string | null;
};

const initialState: AdminStockState = {
  vehicles: [],
  categories: [],
  specsReady: false,
  loading: true,
  error: null,
};

export function useAdminStock() {
  const [state, setState] = useState<AdminStockState>(initialState);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const result = await fetchAdminStock();
      setState({ ...result, loading: false, error: null });
    } catch (cause) {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar el stock desde Supabase.",
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
