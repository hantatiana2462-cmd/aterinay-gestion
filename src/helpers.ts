import { Delivery, DeliveryStatus } from "./types";
import { PARTNER_CLIENTS } from "./constants";

export const formatAr = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(Number.isFinite(n) ? n : 0)} Ar`;

export const statusLabel = (status: DeliveryStatus) => {
  if (status === "faite") return "Faite";
  if (status === "en_cours") return "En cours";
  return "Non faite";
};

export const statusClass = (status: DeliveryStatus) => {
  if (status === "faite") return "statusDone";
  if (status === "en_cours") return "statusPending";
  return "statusCancelled";
};

export const isPartnerClient = (client: string) =>
  PARTNER_CLIENTS.some(
    (partner) => String(partner).trim().toLowerCase() === client.trim().toLowerCase()
  );

/**
 * REÇU CLIENT
 * Seules les livraisons FAITES génèrent un reçu.
 * Non faite / en cours → 0
 */
export const getClientReceipt = (d: Delivery) => {
  if (d.status !== "faite") return 0;
  if (isPartnerClient(d.client)) return 0;

  const colisNous = d.colisPayment === "nous" ? d.prix : 0;
  const colisMvola = d.colisPayment === "mobile_money_nous" ? d.prix : 0;
  const recuDirectClient = d.fraisPayment === "direct_client" ? d.frais : 0;

  return colisNous + colisMvola - recuDirectClient;
};

/**
 * VERSEMENT LIVREUR
 * Seules les livraisons FAITES génèrent un versement.
 * Non faite / en cours → 0
 * Mvola et direct client → 0
 */
export const getRiderVersement = (d: Delivery) => {
  if (d.status !== "faite") return 0;

  const prixPart = d.colisPayment === "nous" ? d.prix : 0;
  const fraisPart = d.fraisPayment === "nous" ? d.frais : 0;

  return prixPart + fraisPart;
};

export const getOutstandingVersement = (d: Delivery) => {
  if (d.paymentStatus === "recu") return 0;
  return getRiderVersement(d);
};

export const getRetourCount = (d: Delivery) => {
  if (d.status === "non_faite") return 1;
  if (d.status === "faite") return d.retours;
  return 0;
};

export const isSameMonth = (date: string, ref: string) =>
  date.slice(0, 7) === ref.slice(0, 7);

import { ClientAdjustment } from "./types";

export const getClientAdjustmentsTotal = (
  adjustments: ClientAdjustment[]
) => {
  return adjustments.reduce((sum, a) => sum + a.amount, 0);
};

export const getClientFinalTotal = (
  deliveries: Delivery[],
  adjustments: ClientAdjustment[]
) => {
  const deliveriesTotal = deliveries.reduce(
    (sum, d) => sum + getClientReceipt(d),
    0
  );

  const adjustmentsTotal = getClientAdjustmentsTotal(adjustments);

  return deliveriesTotal + adjustmentsTotal;
};
