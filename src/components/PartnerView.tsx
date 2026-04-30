import { useState } from "react";
import { Delivery, PartnerInvoiceData, PartnerPurchaseEntry } from "../types";
import { formatAr, isSameMonth, normalizeAriaryInput, statusLabel } from "../helpers";
import { generatePartnerReportPdf } from "../utils/partnerReportPdf";
import {
  generatePartnerInvoicePdf,
  generatePartnerInvoiceTicketPdf,
} from "../utils/partnerInvoicePdf";

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
  const [invoice, setInvoice] = useState<PartnerInvoiceData>({
    partnerKey,
    sellerCompany: title,
    buyerName: "",
    sellerName: "",
    invoiceDate: selectedDate,
    lines: [{ id: Date.now(), product: "", unitPrice: 0, quantity: 1 }],
  });

  const monthlyPurchases = purchases.filter((p) =>
    isSameMonth(p.date, selectedDate)
  );
  const dailyPurchases = purchases.filter((p) => p.date === selectedDate);
  const doneDay = stats.dailyRows.filter((d) => d.status === "faite");
  const failedDay = stats.dailyRows.filter((d) => d.status === "non_faite");
  const pendingDay = stats.dailyRows.filter((d) => d.status === "en_cours");
  const doneMonth = stats.monthlyRows.filter((d) => d.status === "faite");
  const failedMonth = stats.monthlyRows.filter((d) => d.status === "non_faite");
  const pendingMonth = stats.monthlyRows.filter((d) => d.status === "en_cours");
  const dailyFrais = doneDay.reduce((sum, d) => sum + d.frais, 0);
  const monthlyFrais = doneMonth.reduce((sum, d) => sum + d.frais, 0);

  const normalizePurchaseAmount = () => {
    const amount = normalizeAriaryInput(formState.amount);
    if (amount) onFormChange({ ...formState, amount });
  };

  const cleanInvoice = {
    ...invoice,
    partnerKey,
    sellerCompany: invoice.sellerCompany.trim() || title,
    invoiceDate: invoice.invoiceDate || selectedDate,
    lines: invoice.lines.map((line) => ({
      ...line,
      unitPrice: Number(normalizeAriaryInput(String(line.unitPrice)) || line.unitPrice),
      quantity: Number(line.quantity || 0),
    })),
  };

  const invoiceTotal = cleanInvoice.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );

  const updateInvoiceLine = (
    id: number,
    field: "product" | "unitPrice" | "quantity",
    value: string
  ) => {
    setInvoice((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]:
                field === "product"
                  ? value
                  : field === "unitPrice"
                    ? Number(normalizeAriaryInput(value) || 0)
                    : Number(value || 0),
            }
          : line
      ),
    }));
  };

  return (
    <section className="financePage">
      <div className="statsGrid compactStatsGrid">
        <div className="statCard compactStatCard">
          <span>Ventes colis jour</span>
          <strong>{formatAr(stats.dailyColis)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Achats jour</span>
          <strong>{formatAr(stats.dailyPurchases)}</strong>
        </div>
        <div
          className={`statCard compactStatCard ${
            stats.dailyProfit >= 0 ? "gainCard" : "expenseCard"
          }`}
        >
          <span>Benefice jour</span>
          <strong>{formatAr(stats.dailyProfit)}</strong>
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
              Jour : {doneDay.length} faites / {failedDay.length} non faites /{" "}
              {pendingDay.length} en cours · Frais jour : {formatAr(dailyFrais)}
              <br />
              Mois : {doneMonth.length} faites / {failedMonth.length} non faites /{" "}
              {pendingMonth.length} en cours · Frais mois : {formatAr(monthlyFrais)}
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

            <div className="panel partnerInvoicePanel">
              <div className="panelHeaderRow">
                <div>
                  <h3>Faire une facture</h3>
                  <p className="emptySmall">
                    Facture A4 ou ticket 80mm avec total automatique.
                  </p>
                </div>
                <div className="actionGroup">
                  <button
                    className="primaryBtn"
                    type="button"
                    onClick={() => generatePartnerInvoicePdf(cleanInvoice)}
                  >
                    Facture A4
                  </button>
                  <button
                    className="secondaryBtn"
                    type="button"
                    onClick={() => generatePartnerInvoiceTicketPdf(cleanInvoice)}
                  >
                    Ticket 80mm
                  </button>
                </div>
              </div>

              <div className="editGrid">
                <div className="fieldBlock">
                  <label>Nom du client acheteur</label>
                  <input
                    value={invoice.buyerName}
                    placeholder="Client qui achete"
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, buyerName: e.target.value }))
                    }
                  />
                </div>
                <div className="fieldBlock">
                  <label>Entreprise qui vend</label>
                  <input
                    value={invoice.sellerCompany}
                    placeholder={title}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        sellerCompany: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="fieldBlock">
                  <label>Date facture</label>
                  <input
                    type="date"
                    value={invoice.invoiceDate}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        invoiceDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="fieldBlock">
                  <label>Nom signature vendeur</label>
                  <input
                    value={invoice.sellerName}
                    placeholder="Celui qui vend"
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, sellerName: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="deliveryTableWrap invoiceTableWrap">
                <table className="deliveryTable">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Prix unitaire</th>
                      <th>Nombre</th>
                      <th>Total produit</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          <input
                            value={line.product}
                            placeholder="Nom du produit"
                            onChange={(e) =>
                              updateInvoiceLine(line.id, "product", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            inputMode="decimal"
                            value={line.unitPrice || ""}
                            placeholder="Prix"
                            onChange={(e) =>
                              updateInvoiceLine(line.id, "unitPrice", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity || ""}
                            onChange={(e) =>
                              updateInvoiceLine(line.id, "quantity", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <strong>{formatAr(line.unitPrice * line.quantity)}</strong>
                        </td>
                        <td>
                          <button
                            className="deleteBtn"
                            type="button"
                            onClick={() =>
                              setInvoice((prev) => ({
                                ...prev,
                                lines:
                                  prev.lines.length === 1
                                    ? prev.lines
                                    : prev.lines.filter((item) => item.id !== line.id),
                              }))
                            }
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="financeTotal gainTotal">
                <span>Prix total</span>
                <strong>{formatAr(invoiceTotal)}</strong>
              </div>

              <button
                className="secondaryBtn"
                type="button"
                onClick={() =>
                  setInvoice((prev) => ({
                    ...prev,
                    lines: [
                      ...prev.lines,
                      { id: Date.now(), product: "", unitPrice: 0, quantity: 1 },
                    ],
                  }))
                }
              >
                Ajouter un produit
              </button>
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
              <div className="partnerMobileList">
                {stats.dailyRows.length === 0 ? (
                  <div className="emptySmall">Aucune livraison aujourd'hui.</div>
                ) : (
                  stats.dailyRows.map((d) => (
                    <article className="partnerMobileCard" key={d.id}>
                      <div>
                        <strong>{d.lieu}</strong>
                        <span>{statusLabel(d.status)}</span>
                      </div>
                      <div className="salaryMobileGrid">
                        <span>Colis <strong>{formatAr(d.prix)}</strong></span>
                        <span>Frais <strong>{formatAr(d.frais)}</strong></span>
                      </div>
                      {(d.raison || d.description) && (
                        <p>{d.raison || d.description}</p>
                      )}
                    </article>
                  ))
                )}
              </div>
              <div className="deliveryTableWrap partnerDesktopTable">
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
              <div className="partnerMobileList">
                {stats.monthlyRows.length === 0 ? (
                  <div className="emptySmall">Aucune livraison ce mois.</div>
                ) : (
                  stats.monthlyRows.map((d) => (
                    <article className="partnerMobileCard" key={d.id}>
                      <div>
                        <strong>{d.lieu}</strong>
                        <span>{d.date} / {statusLabel(d.status)}</span>
                      </div>
                      <div className="salaryMobileGrid">
                        <span>Colis <strong>{formatAr(d.prix)}</strong></span>
                        <span>Frais <strong>{formatAr(d.frais)}</strong></span>
                      </div>
                    </article>
                  ))
                )}
              </div>
              <div className="deliveryTableWrap partnerDesktopTable">
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
