import { useEffect } from "react";
import { usePiqueteContext } from "../context/PiqueteContext";

/**
 * Hook that initializes piquete data on mount.
 * Call once in a top-level component (e.g., App or Layout).
 */
export function usePiquetes() {
  const { piquetes, loading, error, fetchAll } = usePiqueteContext();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { piquetes, loading, error, refetch: fetchAll };
}
