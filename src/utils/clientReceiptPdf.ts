import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Delivery, ClientAdjustment } from "../types";
import { formatAr } from "../helpers";
import logo from "../assets/logo.png";

const loadImageData = (src: string) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas non disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });

type PdfRow = {
  lieu: string;
  statut: string;
  prix: string;
  detail: string;
  total: string;
};

const getStatusLabel = (status: Delivery["status"]) => {
  if (status === "faite") return "Faite";
  if (status === "non_faite") return "Non faite";
  return "En cours";
};

const buildReceiptRows = (deliveries: Delivery[]): PdfRow[] => {
  return deliveries.map((d) => {
    let detail = "—";
    let total: number | string = "—";

    if (d.status === "faite") {
      const isCounted =
        d.colisPayment === "nous" ||
        d.colisPayment === "mobile_money_nous";

      const base = isCounted ? d.prix : 0;
      const deduction =
        d.fraisPayment === "direct_client" ? d.frais : 0;

      if (!isCounted) {
        detail = "Paye direct client (non compte)";
      } else if (deduction > 0) {
        detail = `Moins ${formatAr(deduction)} frais livraison`;
      } else {
        detail = "Aucune deduction";
      }

      total = base - deduction;
    }

    if (d.status === "non_faite") {
      detail = "Non comptabilisee";
      total = 0;
    }

    if (d.status === "en_cours") {
      detail = "En attente";
      total = "—";
    }

    return {
      lieu: d.lieu,
      statut: getStatusLabel(d.status),
      prix: formatAr(d.prix),
      detail,
      total: typeof total === "number" ? formatAr(total) : total,
    };
  });
};

const getDeliveriesTotal = (deliveries: Delivery[]) => {
  return deliveries.reduce((sum, d) => {
    if (d.status !== "faite") return sum;

    const base =
      d.colisPayment === "nous" ||
      d.colisPayment === "mobile_money_nous"
        ? d.prix
        : 0;

    const deduction =
      d.fraisPayment === "direct_client" ? d.frais : 0;

    return sum + base - deduction;
  }, 0);
};

const getAdjustmentsTotal = (adjustments: ClientAdjustment[]) => {
  return adjustments.reduce((sum, a) => sum + a.amount, 0);
};

export async function generateClientReceiptPdf(params: {
  clientName: string;
  deliveries: Delivery[];
  adjustments: ClientAdjustment[];
}) {
  const { clientName, deliveries, adjustments } = params;

  const doc = new jsPDF();

  const logoData = await loadImageData(logo);

doc.addImage(logoData, "PNG", 14, 10, 22, 22);
doc.setFontSize(18);
doc.text("Aterinay", 42, 18);
doc.setFontSize(11);
doc.text("Recu client", 42, 25);

  const totalFaites = deliveries.filter((d) => d.status === "faite").length;
  const totalNonFaites = deliveries.filter((d) => d.status === "non_faite").length;
  const totalEnCours = deliveries.filter((d) => d.status === "en_cours").length;

  const deliveryRows = buildReceiptRows(deliveries);
  const deliveriesTotal = getDeliveriesTotal(deliveries);
  const adjustmentsTotal = getAdjustmentsTotal(adjustments);
  const finalTotal = deliveriesTotal + adjustmentsTotal;

  doc.setFontSize(12);
doc.text(`Client: ${clientName}`, 14, 40);
doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, 47);

  doc.setFontSize(11);
  doc.text(
  `Faites: ${totalFaites} / Non faites: ${totalNonFaites} / En cours: ${totalEnCours}`,
  14,
  56
);

autoTable(doc, {
  startY: 64,
    head: [["Lieu", "Statut", "Prix colis", "Detail calcul", "Total ligne"]],
    body: deliveryRows.map((r) => [r.lieu, r.statut, r.prix, r.detail, r.total]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [49, 92, 253] },
  });

  let y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  y += 10;

  if (adjustments.length > 0) {
    doc.setFontSize(13);
    doc.text("Ajustements", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Libelle", "Montant"]],
      body: adjustments.map((a) => [a.label, formatAr(a.amount)]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [100, 116, 139] },
    });

    y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 10;
  }

  doc.setFontSize(12);
  doc.text(`Sous-total livraisons: ${formatAr(deliveriesTotal)}`, 14, y);
  doc.text(`Total ajustements: ${formatAr(adjustmentsTotal)}`, 14, y + 8);

  doc.setFontSize(14);
  doc.text(`Total final: ${formatAr(finalTotal)}`, 14, y + 20);

  const safeClient = clientName.replace(/\s+/g, "_").toLowerCase();
  doc.save(`recu_client_${safeClient}.pdf`);
}
export async function generateClientReceiptTicketPdf(params: {
  clientName: string;
  deliveries: Delivery[];
  adjustments: ClientAdjustment[];
}) {
  const { clientName, deliveries, adjustments } = params;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 220],
  });

  const logoData = await loadImageData(logo);

  const margin = 5;
  let y = 8;

  const deliveriesTotal = getDeliveriesTotal(deliveries);
  const adjustmentsTotal = getAdjustmentsTotal(adjustments);
  const finalTotal = deliveriesTotal + adjustmentsTotal;

  const totalFaites = deliveries.filter((d) => d.status === "faite").length;
  const totalNonFaites = deliveries.filter((d) => d.status === "non_faite").length;
  const totalEnCours = deliveries.filter((d) => d.status === "en_cours").length;

  doc.addImage(logoData, "PNG", margin, y, 14, 14);
  doc.setFontSize(14);
  doc.text("Aterinay", 23, y + 6);
  doc.setFontSize(9);
  doc.text("Recu client", 23, y + 11);

  y += 20;

  doc.setDrawColor(49, 92, 253);
  doc.line(margin, y, 75, y);
  y += 6;

  doc.setFontSize(9);
  doc.text(`Client: ${clientName}`, margin, y);
  y += 5;
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
  y += 5;
  doc.text(`Faites: ${totalFaites} | Non faites: ${totalNonFaites} | En cours: ${totalEnCours}`, margin, y);

  y += 7;
  doc.line(margin, y, 75, y);
  y += 5;

  deliveries.forEach((d, index) => {
    let detail = "—";
    let total: number | string = "—";

    if (d.status === "faite") {
      const isCounted =
        d.colisPayment === "nous" ||
        d.colisPayment === "mobile_money_nous";

      const base = isCounted ? d.prix : 0;
      const deduction = d.fraisPayment === "direct_client" ? d.frais : 0;

      if (!isCounted) {
        detail = "Paye direct client";
      } else if (deduction > 0) {
        detail = `Moins ${formatAr(deduction)}`;
      } else {
        detail = "Aucune deduction";
      }

      total = base - deduction;
    }

    if (d.status === "non_faite") {
      detail = d.raison ? `Non faite: ${d.raison}` : "Non faite";
      total = 0;
    }

    if (d.status === "en_cours") {
      detail = "En attente";
      total = "—";
    }

    doc.setFillColor(245, 247, 255);
    doc.roundedRect(margin, y - 3, 70, 27, 2, 2, "F");

    doc.setFontSize(8);
    doc.text(`#${index + 1} - ${getStatusLabel(d.status)}`, margin + 2, y + 1);
    y += 5;

    doc.text(`Lieu: ${d.lieu}`, margin + 2, y);
    y += 5;

    doc.text(`Prix: ${formatAr(d.prix)}`, margin + 2, y);
    y += 5;

    doc.text(`Detail: ${detail}`, margin + 2, y);
    y += 5;

    doc.setFontSize(9);
    doc.text(
      `Total: ${typeof total === "number" ? formatAr(total) : total}`,
      margin + 2,
      y
    );

    y += 10;
  });

  if (adjustments.length > 0) {
    doc.line(margin, y, 75, y);
    y += 5;

    doc.setFontSize(10);
    doc.text("Ajustements", margin, y);
    y += 5;

    adjustments.forEach((a) => {
      doc.setFontSize(8);
      doc.text(`${a.label}: ${formatAr(a.amount)}`, margin, y);
      y += 5;
    });
  }

  y += 3;
  doc.line(margin, y, 75, y);
  y += 6;

  doc.setFontSize(9);
  doc.text(`Sous-total: ${formatAr(deliveriesTotal)}`, margin, y);
  y += 5;
  doc.text(`Ajustements: ${formatAr(adjustmentsTotal)}`, margin, y);
  y += 7;

  doc.setFontSize(12);
  doc.text(`TOTAL: ${formatAr(finalTotal)}`, margin, y);

  const safeClient = clientName.replace(/\s+/g, "_").toLowerCase();
  doc.save(`ticket_client_${safeClient}.pdf`);
}