import { useMemo } from "react";
import { Delivery } from "../types";

/**
 * Hook pour filtrer et rechercher les livraisons
 * Memoïzé pour éviter les recalculs inutiles
 */
export function useSearchDeliveries(
  deliveries: Delivery[],
  searchText: string
) {
  return useMemo(() => {
    const s = searchText.trim().toLowerCase();
    if (!s) return deliveries;

    return deliveries.filter((d) =>
      d.client.toLowerCase().includes(s) ||
      d.rider.toLowerCase().includes(s) ||
      d.lieu.toLowerCase().includes(s) ||
      d.description.toLowerCase().includes(s) ||
      d.raison.toLowerCase().includes(s)
    );
  }, [deliveries, searchText]);
}

/**
 * Hook pour filtrer par date
 */
export function useDeliveriesByDate(
  deliveries: Delivery[],
  date: string
) {
  return useMemo(
    () => deliveries.filter((d) => d.date === date),
    [deliveries, date]
  );
}

/**
 * Hook pour filtrer par mois
 */
export function useDeliveriesByMonth(
  deliveries: Delivery[],
  date: string
) {
  return useMemo(
    () =>
      deliveries.filter((d) => d.date.slice(0, 7) === date.slice(0, 7)),
    [deliveries, date]
  );
}
