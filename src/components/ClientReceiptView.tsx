import { Delivery, ClientAdjustment } from "../types";
import { formatAr, statusLabel } from "../helpers";
import {
  generateClientReceiptPdf,
  generateClientReceiptTicketPdf,
} from "../utils/clientReceiptPdf";

type Props = {
  clientName: string;
  deliveries: Delivery[];
  adjustments: ClientAdjustment[];
};

export default function ClientReceiptView({
  clientName,
  deliveries,
  adjustments,
}: Props) {
  
  // 🔢 Stats
  const totalFaites = deliveries.filter((d) => d.status === "faite").length;
  const totalNonFaites = deliveries.filter((d) => d.status === "non_faite").length;
  const totalEnCours = deliveries.filter((d) => d.status === "en_cours").length;

  // 💰 Total livraisons (logique existante)
  const deliveriesTotal = deliveries.reduce((sum, d) => {
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

  // ➕ Ajustements
  const adjustmentsTotal = adjustments.reduce((sum, a) => sum + a.amount, 0);

  // 🧮 Total final
  const finalTotal = deliveriesTotal + adjustmentsTotal;

  return (
    <div className="clientReceipt">

      {/* ===== Résumé ===== */}
      <div className="receiptActions">
  <button
    className="primaryBtn"
    type="button"
    onClick={async () =>
  await generateClientReceiptPdf({
    clientName,
    deliveries,
    adjustments,
  })
}
  >
    Télécharger PDF
  </button>
  <button
  className="secondaryBtn"
  type="button"
  onClick={async () =>
    await generateClientReceiptTicketPdf({
      clientName,
      deliveries,
      adjustments,
    })
  }
>
  Ticket 80mm
</button>
</div>
      <div className="receiptSummary">
        <div>✅ Faites : {totalFaites}</div>
        <div>❌ Non faites : {totalNonFaites}</div>
        <div>⏳ En cours : {totalEnCours}</div>
        <div className="totalLine">
          Total actuel : {formatAr(deliveriesTotal)}
        </div>
      </div>

      {/* ===== Tableau livraisons ===== */}
      <table className="receiptTable">
        <thead>
          <tr>
            <th>Lieu</th>
            <th>Statut</th>
            <th>Raison</th>
            <th>Prix</th>
            <th>Détail</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {deliveries.map((d) => {
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
    detail = "Payé direct client (non compté)";
  } else if (deduction > 0) {
    detail = `- ${formatAr(deduction)} frais`;
  } else {
    detail = "Aucune déduction";
  }

  total = base - deduction;
}

            if (d.status === "non_faite") {
              detail = "Non comptabilisée";
              total = 0;
            }

            if (d.status === "en_cours") {
              detail = "En attente";
              total = "—";
            }

            return (
              <tr key={d.id}>
                <td>{d.lieu}</td>
                <td>{statusLabel(d.status)}</td>
                <td>
                  {d.status === "non_faite" && d.raison.trim()
                    ? d.raison.trim()
                    : "-"}
                </td>
                <td>{formatAr(d.prix)}</td>
                <td>{detail}</td>
                <td>{typeof total === "number" ? formatAr(total) : total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ===== Ajustements ===== */}
      {adjustments.length > 0 && (
        <div className="adjustmentsSection">
          <h3>Ajustements</h3>

          <table className="receiptTable">
            <thead>
              <tr>
                <th>Libellé</th>
                <th>Montant</th>
              </tr>
            </thead>

            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id}>
                  <td>{a.label}</td>
                  <td>{formatAr(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Total final ===== */}
      <div className="finalTotal">
        Total final : {formatAr(finalTotal)}
      </div>
    </div>
  );
}
