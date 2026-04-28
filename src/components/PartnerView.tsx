import { Delivery, PartnerPurchaseEntry } from "../types";
import { formatAr, isSameMonth, normalizeAriaryInput, statusLabel } from "../helpers";
import { generatePartnerReportPdf } from "../utils/partnerReportPdf";

type PartnerStats = {
  dailyRows: Delivery[];
  monthlyRows: Delivery[];
  dailyColis: number;
  monthlyColis: number;
  dailyPurchases: number;
  monthlyPurchases: number;
  dailyProfit: number;
  monthlyProfit: number;
};

type PartnerForm = {
  date: string;
  amount: string;
  description: string;
};

type Props = {
  partnerKey: "pomanai" | "zazatiana";
  title: string;
  stats: PartnerStats;
  purchases: PartnerPurchaseEntry[];
  formState: PartnerForm;
  selectedDate: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onFormChange: (form: PartnerForm) => void;
  onAddPurchase: () => void;
  onDeletePurchase: (id: number) => void;
};

export default function PartnerView({
  partnerKey,
  title,
  stats,
  purchases,
  formState,
  selectedDate,
  isOpen,
  onToggleOpen,
  onFormChange,
  onAddPurchase,
  onDeletePurchase,
}: Props) {
  const monthlyPurchases = purchases.filter((p) =>
    isSameMonth(p.date, selectedDate)
  );
  const dailyPurchases = purchases.filter((p) => p.date === selectedDate);
  const doneMonth = stats.monthlyRows.filter((d) => d.status === "faite");
  const failedMonth = stats.monthlyRows.filter((d) => d.status === "non_faite");
  const pendingMonth = stats.monthlyRows.filter((d) => d.status === "en_cours");
  const monthlyFrais = doneMonth.reduce((sum, d) => sum + d.frais, 0);

  const normalizePurchaseAmount = () => {
    const amount = normalizeAriaryInput(formState.amount);
    if (amount) onFormChange({ ...formState, amount });
  };

  return (
    <section className="financePage">
      <div className="statsGrid compactStatsGrid">
        <div className="statCard compactStatCard">
          <span>Ventes colis jour</span>
          <strong>{formatAr(stats.dailyColis)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Ventes colis mois</span>
          <strong>{formatAr(stats.monthlyColis)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Achats mois</span>
          <strong>{formatAr(stats.monthlyPurchases)}</strong>
        </div>
        <div
          className={`statCard compactStatCard ${
            stats.monthlyProfit >= 0 ? "gainCard" : "expenseCard"
          }`}
        >
          <span>Benefice brut mois</span>
          <strong>{formatAr(stats.monthlyProfit)}</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panelHeaderRow">
          <div>
            <h2>{title}</h2>
            <p className="emptySmall">
              {doneMonth.length} faites · {failedMonth.length} non faites ·{" "}
              {pendingMonth.length} en cours · Frais livraison mois :{" "}
              {formatAr(monthlyFrais)}
            </p>
          </div>
          <div className="actionGroup">
            <button
              className="secondaryBtn"
              type="button"
              onClick={() =>
                generatePartnerReportPdf({
                  partnerName: partnerKey,
                  selectedDate,
                  deliveries: stats.monthlyRows,
                  purchases,
                })
              }
            >
              PDF mois
            </button>
            <button className="secondaryBtn" type="button" onClick={onToggleOpen}>
              {isOpen ? "Fermer" : "Dossier"}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="groupList">
            <div className="statsGrid compactStatsGrid">
              <div className="statCard compactStatCard">
                <span>Achats jour</span>
                <strong>{formatAr(stats.dailyPurchases)}</strong>
              </div>
              <div className="statCard compactStatCard">
                <span>Benefice jour</span>
                <strong>{formatAr(stats.dailyProfit)}</strong>
              </div>
              <div className="statCard compactStatCard">
                <span>Livraisons mois</span>
                <strong>{stats.monthlyRows.length}</strong>
              </div>
              <div className="statCard compactStatCard">
                <span>Achats enregistres</span>
                <strong>{monthlyPurchases.length}</strong>
              </div>
            </div>

            <div className="panel">
              <h3>Ajouter un achat / approvisionnement</h3>

              <div className="financeEntryForm">
                <input
                  type="date"
                  value={formState.date}
                  onChange={(e) =>
                    onFormChange({ ...formState, date: e.target.value })
                  }
                />
                <input
                  inputMode="decimal"
                  placeholder="Montant achat"
                  value={formState.amount}
                  onBlur={normalizePurchaseAmount}
                  onChange={(e) =>
                    onFormChange({ ...formState, amount: e.target.value })
                  }
                />
                <button className="primaryBtn" type="button" onClick={onAddPurchase}>
                  Ajouter achat
                </button>
              </div>

              <textarea
                placeholder="Description achat, fournisseur, reference..."
                value={formState.description}
                onChange={(e) =>
                  onFormChange({ ...formState, description: e.target.value })
                }
              />
            </div>

            <div className="twoCols financeCols">
              <div className="panel">
                <h3>Achats du mois</h3>
                <div className="list">
                  {monthlyPurchases.length === 0 ? (
                    <div className="emptySmall">Aucun achat ce mois.</div>
                  ) : (
                    monthlyPurchases.map((p) => (
                      <div className="moneyItem expenseItem" key={p.id}>
                        <div>
                          <strong>{p.description || "Achat partenaire"}</strong>
                          <small>
                            {p.date} · {formatAr(p.amount)}
                          </small>
                        </div>
                        <button
                          className="deleteBtn"
                          type="button"
                          onClick={() => onDeletePurchase(p.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="panel">
                <h3>Achats du jour</h3>
                <div className="compactList">
                  {dailyPurchases.length === 0 ? (
                    <div className="emptySmall">Aucun achat aujourd'hui.</div>
                  ) : (
                    dailyPurchases.map((p) => (
                      <div className="compactLineRow" key={p.id}>
                        <span>{p.description || p.date}</span>
                        <strong>{formatAr(p.amount)}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="panel">
              <h3>Livraisons du jour</h3>
              <div className="deliveryTableWrap">
                <table className="deliveryTable">
                  <thead>
                    <tr>
                      <th>Lieu</th>
                      <th>Statut</th>
                      <th>Prix colis</th>
                      <th>Frais</th>
                      <th>Raison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.dailyRows.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Aucune livraison aujourd'hui.</td>
                      </tr>
                    ) : (
                      stats.dailyRows.map((d) => (
                        <tr key={d.id}>
                          <td>{d.lieu}</td>
                          <td>{statusLabel(d.status)}</td>
                          <td>{formatAr(d.prix)}</td>
                          <td>{formatAr(d.frais)}</td>
                          <td>{d.raison || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <h3>Livraisons du mois</h3>
              <div className="deliveryTableWrap">
                <table className="deliveryTable">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Lieu</th>
                      <th>Statut</th>
                      <th>Prix colis</th>
                      <th>Frais</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.monthlyRows.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Aucune livraison ce mois.</td>
                      </tr>
                    ) : (
                      stats.monthlyRows.map((d) => (
                        <tr key={d.id}>
                          <td>{d.date}</td>
                          <td>{d.lieu}</td>
                          <td>{statusLabel(d.status)}</td>
                          <td>{formatAr(d.prix)}</td>
                          <td>{formatAr(d.frais)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
