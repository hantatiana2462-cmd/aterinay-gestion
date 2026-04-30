import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import { RiderPayroll } from "../types";
import { formatAr } from "../helpers";

type PayrollStat = RiderPayroll & {
  advancesTotal: number;
  recoveryAmount: number;
  totalSalary: number;
};

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

const formatDate = (date?: string) => {
  if (!date) return "Non renseignee";
  return new Date(date).toLocaleDateString("fr-FR");
};

const safeFilePart = (value: string) =>
  value.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "").toLowerCase();

export async function generatePayrollSlipPdf(payroll: PayrollStat) {
  const doc = new jsPDF();
  const logoData = await loadImageData(logo);
  const fullName = payroll.fullName?.trim() || payroll.rider;
  const period =
    payroll.periodStart || payroll.periodEnd
      ? `${formatDate(payroll.periodStart)} au ${formatDate(payroll.periodEnd)}`
      : "Non renseignee";
  const slipNumber = `SAL-${new Date().getFullYear()}-${String(payroll.rider).toUpperCase()}-${Date.now()
    .toString()
    .slice(-5)}`;

  doc.addImage(logoData, "PNG", 14, 10, 22, 22);
  doc.setFontSize(18);
  doc.text("Aterinay", 42, 18);
  doc.setFontSize(11);
  doc.text("Fiche de paie", 42, 25);
  doc.text(`Reference: ${slipNumber}`, 145, 18);
  doc.text(`Edition: ${new Date().toLocaleDateString("fr-FR")}`, 145, 25);

  doc.setDrawColor(49, 92, 253);
  doc.line(14, 36, 196, 36);

  doc.setFontSize(13);
  doc.text("Employeur", 14, 48);
  doc.setFontSize(10);
  doc.text("Aterinay", 14, 55);
  doc.text("Gestion de livraisons", 14, 61);

  doc.setFontSize(13);
  doc.text("Employe", 110, 48);
  doc.setFontSize(10);
  doc.text(`Nom complet: ${fullName}`, 110, 55);
  doc.text(`CIN: ${payroll.cin?.trim() || "Non renseigne"}`, 110, 61);
  doc.text(`Nom interne: ${payroll.rider}`, 110, 67);
  doc.text(`Poste: ${payroll.role || "Livreur"}`, 110, 73);

  autoTable(doc, {
    startY: 84,
    head: [["Information", "Valeur"]],
    body: [
      ["Periode de paie", period],
      ["Date de reception du salaire", formatDate(payroll.paymentDate)],
      ["Mode de paiement", payroll.paymentMethod || "Non renseigne"],
      ["Reference paiement", payroll.paymentReference || "-"],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [49, 92, 253] },
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 110 } },
  });

  const yAfterInfo =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 110;

  autoTable(doc, {
    startY: yAfterInfo + 10,
    head: [["Element", "Type", "Montant"]],
    body: [
      ["Salaire de base", "Gain", formatAr(payroll.baseSalary)],
      [
        `Recuperations (${payroll.recoveries} x 1 000 Ar)`,
        "Gain",
        formatAr(payroll.recoveryAmount),
      ],
      ["Avances deduites", "Deduction", `-${formatAr(payroll.advancesTotal)}`],
      ["Net a payer", "Total", formatAr(payroll.totalSalary)],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [49, 92, 253] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 45 },
      2: { halign: "right", cellWidth: 45 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 3) {
        data.cell.styles.fillColor = [220, 252, 231];
        data.cell.styles.textColor = [22, 101, 52];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  let y =
    ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? yAfterInfo) + 10;

  if (payroll.advances.length > 0) {
    doc.setFontSize(13);
    doc.text("Details des avances", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Libelle", "Montant"]],
      body: payroll.advances.map((a) => [
        formatDate(a.date),
        a.label,
        formatAr(a.amount),
      ]),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [100, 116, 139] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 105 },
        2: { halign: "right", cellWidth: 40 },
      },
    });

    y =
      ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? y) + 10;
  }

  if (payroll.notes?.trim()) {
    doc.setFontSize(11);
    doc.text("Notes", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(payroll.notes.trim(), 180), 14, y);
    y += 14;
  }

  y = Math.max(y, 250);
  doc.setFontSize(10);
  doc.text("Signature employe", 14, y);
  doc.line(14, y + 18, 78, y + 18);
  doc.text("Signature responsable", 122, y);
  doc.line(122, y + 18, 190, y + 18);

  doc.setFontSize(8);
  doc.text(
    "Document genere par Aterinay. A verifier et signer apres paiement effectif.",
    14,
    288
  );

  doc.save(`fiche_paie_${safeFilePart(fullName)}.pdf`);
}

export async function generatePayrollSlipTicketPdf(payroll: PayrollStat) {
  const fullName = payroll.fullName?.trim() || payroll.rider;
  const period =
    payroll.periodStart || payroll.periodEnd
      ? `${formatDate(payroll.periodStart)} - ${formatDate(payroll.periodEnd)}`
      : "Non renseignee";
  const height = Math.max(160, 120 + payroll.advances.length * 9);
  const doc = new jsPDF({ unit: "mm", format: [80, height] });
  const logoData = await loadImageData(logo);
  let y = 8;

  doc.addImage(logoData, "PNG", 31, y, 18, 18);
  y += 22;
  doc.setFontSize(11);
  doc.text("FICHE SALAIRE", 40, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.text("Aterinay", 40, y, { align: "center" });
  y += 7;
  doc.line(4, y, 76, y);
  y += 5;

  doc.text(`Employe: ${fullName}`, 4, y);
  y += 5;
  doc.text(`CIN: ${payroll.cin?.trim() || "-"}`, 4, y);
  y += 5;
  doc.text(`Poste: ${payroll.role || "Livreur"}`, 4, y);
  y += 5;
  doc.text(`Periode: ${period}`, 4, y);
  y += 5;
  doc.text(`Reception: ${formatDate(payroll.paymentDate)}`, 4, y);
  y += 5;
  doc.text(`Paiement: ${payroll.paymentMethod || "-"}`, 4, y);
  y += 5;
  if (payroll.paymentReference) {
    doc.text(`Ref: ${payroll.paymentReference}`, 4, y);
    y += 5;
  }

  doc.line(4, y, 76, y);
  y += 6;
  doc.text("Salaire base", 4, y);
  doc.text(formatAr(payroll.baseSalary), 76, y, { align: "right" });
  y += 5;
  doc.text(`Recuperations (${payroll.recoveries})`, 4, y);
  doc.text(formatAr(payroll.recoveryAmount), 76, y, { align: "right" });
  y += 5;
  doc.text("Avances", 4, y);
  doc.text(`-${formatAr(payroll.advancesTotal)}`, 76, y, { align: "right" });
  y += 6;
  doc.line(4, y, 76, y);
  y += 6;
  doc.setFontSize(10);
  doc.text("NET A PAYER", 4, y);
  doc.text(formatAr(payroll.totalSalary), 76, y, { align: "right" });
  y += 7;

  if (payroll.advances.length > 0) {
    doc.setFontSize(8);
    doc.text("Details avances", 4, y);
    y += 5;
    payroll.advances.forEach((advance) => {
      const label = `${formatDate(advance.date)} ${advance.label}`;
      doc.text(doc.splitTextToSize(label, 48), 4, y);
      doc.text(formatAr(advance.amount), 76, y, { align: "right" });
      y += 8;
    });
  }

  y += 4;
  doc.setFontSize(8);
  doc.text("Signature employe", 4, y);
  doc.line(4, y + 12, 36, y + 12);
  doc.text("Responsable", 44, y);
  doc.line(44, y + 12, 76, y + 12);
  y += 20;
  doc.text("Ticket genere par Aterinay", 40, y, { align: "center" });

  doc.save(`ticket_salaire_${safeFilePart(fullName)}.pdf`);
}

export async function generatePayrollSummaryPdf(params: {
  payrollStats: PayrollStat[];
  totalSalaries: number;
}) {
  const { payrollStats, totalSalaries } = params;
  const doc = new jsPDF();
  const logoData = await loadImageData(logo);

  doc.addImage(logoData, "PNG", 14, 10, 22, 22);
  doc.setFontSize(18);
  doc.text("Aterinay", 42, 18);
  doc.setFontSize(11);
  doc.text("Etat global des salaires", 42, 25);
  doc.text(`Edition: ${new Date().toLocaleDateString("fr-FR")}`, 145, 25);

  autoTable(doc, {
    startY: 42,
    head: [["Livreur", "Nom complet", "CIN", "Base", "Recup.", "Avances", "Net"]],
    body: payrollStats.map((p) => [
      p.rider,
      p.fullName || p.rider,
      p.cin || "-",
      formatAr(p.baseSalary),
      formatAr(p.recoveryAmount),
      formatAr(p.advancesTotal),
      formatAr(p.totalSalary),
    ]),
    foot: [["", "", "", "", "", "Total", formatAr(totalSalaries)]],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [49, 92, 253] },
    footStyles: { fillColor: [220, 252, 231], textColor: [22, 101, 52] },
  });

  doc.save("etat_global_salaires_aterinay.pdf");
}
