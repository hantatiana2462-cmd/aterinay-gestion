import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import { Delivery, PartnerPurchaseEntry } from "../types";
import { formatAr, isSameMonth } from "../helpers";

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

const safeFilePart = (value: string) =>
  value.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "").toLowerCase();

export async function generatePartnerReportPdf(params: {
  partnerName: string;
  selectedDate: string;
  deliveries: Delivery[];
  purchases: PartnerPurchaseEntry[];
}) {
  const { partnerName, selectedDate, deliveries, purchases } = params;
  const monthRows = deliveries.filter(
    (d) => d.client === partnerName && isSameMonth(d.date, selectedDate)
  );
  const doneRows = monthRows.filter((d) => d.status === "faite");
  const monthPurchases = purchases.filter((p) => isSameMonth(p.date, selectedDate));

  const monthlyColis = doneRows.reduce((sum, d) => sum + d.prix, 0);
  const monthlyFrais = doneRows.reduce((sum, d) => sum + d.frais, 0);
  const monthlyPurchasesTotal = monthPurchases.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const profit = monthlyColis - monthlyPurchasesTotal;
  const totalRetours = monthRows.reduce((sum, d) => sum + d.retours, 0);

  const doc = new jsPDF();
  const logoData = await loadImageData(logo);
  const monthLabel = new Date(`${selectedDate.slice(0, 7)}-01`).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" }
  );

  doc.addImage(logoData, "PNG", 14, 10, 22, 22);
  doc.setFontSize(18);
  doc.text("Aterinay", 42, 18);
  doc.setFontSize(11);
  doc.text(`Rapport partenaire - ${partnerName.toUpperCase()}`, 42, 25);
  doc.text(`Periode: ${monthLabel}`, 145, 18);
  doc.text(`Edition: ${new Date().toLocaleDateString("fr-FR")}`, 145, 25);

  autoTable(doc, {
    startY: 42,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Livraisons faites", String(doneRows.length)],
      ["Livraisons non faites", String(monthRows.filter((d) => d.status === "non_faite").length)],
      ["En cours", String(monthRows.filter((d) => d.status === "en_cours").length)],
      ["Retours", String(totalRetours)],
      ["Ventes colis", formatAr(monthlyColis)],
      ["Frais livraison", formatAr(monthlyFrais)],
      ["Achats", formatAr(monthlyPurchasesTotal)],
      ["Benefice brut", formatAr(profit)],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [49, 92, 253] },
  });

  let y =
    ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 90) + 10;

  doc.setFontSize(13);
  doc.text("Livraisons du mois", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Lieu", "Statut", "Prix colis", "Frais", "Raison"]],
    body: monthRows.map((d) => [
      d.date,
      d.lieu,
      d.status,
      formatAr(d.prix),
      formatAr(d.frais),
      d.raison || "-",
    ]),
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [100, 116, 139] },
  });

  y =
    ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y) + 10;

  if (monthPurchases.length > 0) {
    doc.setFontSize(13);
    doc.text("Achats du mois", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Description", "Montant"]],
      body: monthPurchases.map((p) => [
        p.date,
        p.description || "-",
        formatAr(p.amount),
      ]),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [100, 116, 139] },
      columnStyles: { 2: { halign: "right" } },
    });
  }

  doc.save(
    `rapport_${safeFilePart(partnerName)}_${selectedDate.slice(0, 7)}.pdf`
  );
}
