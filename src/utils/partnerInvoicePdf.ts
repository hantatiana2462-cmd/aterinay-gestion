import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import { PartnerInvoiceData } from "../types";
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

const safeFilePart = (value: string) =>
  value.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "").toLowerCase();

const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR");

const getInvoiceTotal = (invoice: PartnerInvoiceData) =>
  invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

const getCleanLines = (invoice: PartnerInvoiceData) =>
  invoice.lines.filter((line) => line.product.trim() && line.quantity > 0);

export async function generatePartnerInvoicePdf(invoice: PartnerInvoiceData) {
  const cleanLines = getCleanLines(invoice);
  if (cleanLines.length === 0) return;

  const doc = new jsPDF();
  const logoData = await loadImageData(logo);
  const invoiceNumber = `FAC-${invoice.partnerKey.toUpperCase()}-${Date.now()
    .toString()
    .slice(-6)}`;

  doc.addImage(logoData, "PNG", 14, 10, 22, 22);
  doc.setFontSize(18);
  doc.text("Aterinay", 42, 18);
  doc.setFontSize(11);
  doc.text("Facture partenaire", 42, 25);

  doc.setFontSize(10);
  doc.text(`Facture: ${invoiceNumber}`, 145, 16);
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 145, 23);

  doc.setDrawColor(49, 92, 253);
  doc.line(14, 36, 196, 36);

  doc.setFontSize(13);
  doc.text("Vendeur", 14, 48);
  doc.setFontSize(10);
  doc.text(invoice.sellerCompany || invoice.partnerKey.toUpperCase(), 14, 55);
  doc.text(`Signature vendeur: ${invoice.sellerName || "-"}`, 14, 62);

  doc.setFontSize(13);
  doc.text("Client acheteur", 112, 48);
  doc.setFontSize(10);
  doc.text(invoice.buyerName || "-", 112, 55);

  autoTable(doc, {
    startY: 76,
    head: [["Produit", "Prix unitaire", "Nombre", "Total produit"]],
    body: cleanLines.map((line) => [
      line.product,
      formatAr(line.unitPrice),
      String(line.quantity),
      formatAr(line.unitPrice * line.quantity),
    ]),
    foot: [["", "", "Prix total", formatAr(getInvoiceTotal({ ...invoice, lines: cleanLines }))]],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [49, 92, 253] },
    footStyles: { fillColor: [220, 252, 231], textColor: [22, 101, 52], fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "center" },
      3: { halign: "right" },
    },
  });

  const y =
    ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120) + 22;

  doc.setFontSize(10);
  doc.text("Signature du vendeur", 14, y);
  doc.line(14, y + 18, 80, y + 18);
  doc.text(invoice.sellerName || "", 14, y + 25);

  doc.save(
    `facture_${safeFilePart(invoice.partnerKey)}_${safeFilePart(invoice.buyerName || "client")}.pdf`
  );
}

export async function generatePartnerInvoiceTicketPdf(invoice: PartnerInvoiceData) {
  const cleanLines = getCleanLines(invoice);
  if (cleanLines.length === 0) return;

  const lineHeight = 5;
  const height = Math.max(160, 86 + cleanLines.length * 24);
  const doc = new jsPDF({ unit: "mm", format: [80, height] });
  const logoData = await loadImageData(logo);
  const total = getInvoiceTotal({ ...invoice, lines: cleanLines });
  const left = 5;
  const right = 70;
  const center = 40;
  let y = 8;

  doc.addImage(logoData, "PNG", 31, y, 18, 18);
  y += 22;
  doc.setFontSize(11);
  doc.text("FACTURE", center, y, { align: "center" });
  y += lineHeight;
  doc.setFontSize(8);
  doc.text(invoice.sellerCompany || invoice.partnerKey.toUpperCase(), center, y, { align: "center" });
  y += lineHeight;
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, left, y);
  y += lineHeight;
  doc.text(`Client: ${invoice.buyerName || "-"}`, left, y);
  y += lineHeight;
  doc.line(left, y, right, y);
  y += 5;

  cleanLines.forEach((line) => {
    const productLines = doc.splitTextToSize(line.product, 62);
    doc.setFontSize(8);
    doc.text(productLines, left, y);
    y += productLines.length * 4;
    doc.text(`Prix unitaire: ${formatAr(line.unitPrice)}`, left, y);
    y += 5;
    doc.text(`Nombre: ${line.quantity}`, left, y);
    y += 5;
    doc.setFontSize(9);
    doc.text("Total produit", left, y);
    doc.text(formatAr(line.unitPrice * line.quantity), right, y, { align: "right" });
    doc.setFontSize(8);
    y += 6;
    doc.line(left, y, right, y);
    y += 4;
  });

  doc.line(left, y, right, y);
  y += 6;
  doc.setFontSize(11);
  doc.text("PRIX TOTAL", left, y);
  doc.text(formatAr(total), right, y, { align: "right" });
  y += 12;

  doc.setFontSize(8);
  doc.text("Signature vendeur", left, y);
  doc.line(left, y + 12, right, y + 12);
  y += 18;
  doc.text(invoice.sellerName || "", left, y);

  doc.save(
    `ticket_facture_${safeFilePart(invoice.partnerKey)}_${safeFilePart(invoice.buyerName || "client")}.pdf`
  );
}
