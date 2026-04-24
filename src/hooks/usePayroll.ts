import { useMemo } from "react";
import { RiderPayroll, Delivery } from "../types";
import {
  getRiderVersement,
  getOutstandingVersement,
  isPartnerClient,
  getClientReceipt,
  getRetourCount,
} from "../helpers";

export function usePayrollStats(payroll: RiderPayroll[]) {
  return useMemo(() => {
    return payroll.map((p) => {
      const advancesTotal = p.advances.reduce((sum, a) => sum + a.amount, 0);
      const recoveryAmount = p.recoveries * 1000;
      const totalSalary = p.baseSalary - advancesTotal + recoveryAmount;

      return {
        ...p,
        advancesTotal,
        recoveryAmount,
        totalSalary,
      };
    });
  }, [payroll]);
}

export function useRiderStats(riders: any[], deliveries: Delivery[]) {
  return useMemo(() => {
    return riders.map((rider) => {
      const rows = deliveries.filter((d) => d.rider === rider.name);
      const faites = rows.filter((d) => d.status === "faite");
      const enCours = rows.filter((d) => d.status === "en_cours");
      const nonFaites = rows.filter((d) => d.status === "non_faite");
      const totalRetours = rows.reduce((sum, d) => sum + getRetourCount(d), 0);

      const totalVersement = rows.reduce(
        (sum, d) => sum + getRiderVersement(d),
        0
      );
      const totalRestant = rows.reduce(
        (sum, d) => sum + getOutstandingVersement(d),
        0
      );
      const totalRecu = totalVersement - totalRestant;

      return {
        riderId: rider.id,
        rider: rider.name,
        active: rider.active,
        rows,
        totalLivraisons: faites.length,
        enCours: enCours.length,
        nonFaites: nonFaites.length,
        totalRetours,
        totalRecu,
        totalRestant,
      };
    });
  }, [riders, deliveries]);
}

export function useClientStats(deliveries: Delivery[]) {
  return useMemo(() => {
    const visibleClients = Array.from(
      new Set(
        deliveries
          .filter((d) => !isPartnerClient(d.client))
          .map((d) => d.client)
      )
    );

    return visibleClients
      .filter(Boolean)
      .map((client) => {
        const rows = deliveries.filter(
          (d) => d.client === client && !isPartnerClient(d.client)
        );
        const faites = rows.filter((d) => d.status === "faite");
        const totalReceipts = rows.reduce(
          (sum, d) => sum + getClientReceipt(d),
          0
        );
        const totalRetours = rows.reduce((sum, d) => sum + getRetourCount(d), 0);

        return {
          client,
          rows,
          totalFaits: faites.length,
          totalRetours,
          totalReceipts,
        };
      })
      .sort((a, b) => a.client.localeCompare(b.client));
  }, [deliveries]);
}
