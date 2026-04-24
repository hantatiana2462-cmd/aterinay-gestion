import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import { Delivery } from "../types";
import { formatAr } from "../helpers";

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

export async function generateRiderDeliveryListPdf(params: {
  riderName: string;
  deliveries: Delivery[];
  selectedDate: string;
}) {
  const { riderName, deliveries, selectedDate } = params;

  const doc = new jsPDF();
  const logoData = await loadImageData(logo);

  doc.addImage(logoData, "PNG", 14, 10, 22, 22);
  doc.setFontSize(18);
  doc.text("Aterinay", 42, 18);
  doc.setFontSize(11);
  doc.text("Liste de livraison livreur", 42, 25);

  doc.setFontSize(12);
  doc.text(`Livreur: ${riderName}`, 14, 40);
  doc.text(`Date: ${selectedDate || new Date().toLocaleDateString("fr-FR")}`, 14, 47);
  doc.text(`Nombre de livraisons: ${deliveries.length}`, 14, 54);

  autoTable(doc, {
    startY: 62,
    head: [["Client", "Contact", "Lieu", "Prix colis", "Frais livraison"]],
    body: deliveries.map((d) => [
      d.client,
      d.contact || "Non renseigné",
      d.lieu,
      formatAr(d.prix),
      formatAr(d.frais),
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [49, 92, 253],
    },
  });

  const safeRider = riderName.replace(/\s+/g, "_").toLowerCase();
  const safeDate = (selectedDate || new Date().toISOString().slice(0, 10)).replaceAll("/", "-");
  doc.save(`liste_livraison_${safeRider}_${safeDate}.pdf`);
}
export function generateRiderDeliveryListTicketPdf(params: {
  riderName: string;
  deliveries: Delivery[];
}) {
  const { riderName, deliveries } = params;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, Math.max(220, 80 + deliveries.length * 45)],
  });

  const margin = 5;
  let y = 8;

  doc.setFontSize(14);
  doc.text("Aterinay", margin, y);

  y += 6;
  doc.setFontSize(10);
  doc.text("Liste livraison livreur", margin, y);

  y += 6;
  doc.setFontSize(9);
  doc.text(`Livreur: ${riderName}`, margin, y);

  y += 5;
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, margin, y);

  y += 6;
  doc.line(margin, y, 75, y);
  y += 5;

  deliveries.forEach((d, index) => {
    doc.setFontSize(9);
    doc.text(`#${index + 1}`, margin, y);
    y += 5;

    doc.text(`Contact: ${d.contact || "-"}`, margin, y);
    y += 5;

    doc.text(`Lieu: ${d.lieu || "-"}`, margin, y);
    y += 5;

    doc.text(`Prix: ${formatAr(d.prix)}`, margin, y);
    y += 5;

    doc.text(`Frais: ${formatAr(d.frais)}`, margin, y);
    y += 5;

    doc.line(margin, y, 75, y);
    y += 5;
  });

  doc.save(`ticket_livreur_${riderName}.pdf`);
}