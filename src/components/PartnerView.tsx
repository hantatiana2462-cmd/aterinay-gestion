import { Delivery, PartnerPurchaseEntry } from "../types";
import { formatAr, isSameMonth } from "../helpers";

type PartnerStats = {
  dailyRows: Delivery[];
  dailyColis: number;
  monthlyColis: number;
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
};

export default function PartnerView({
  title,
  stats,
  purchases,
  formState,
  selectedDate,
  isOpen,
  onToggleOpen,
  onFormChange,
  onAddPurchase,
}: Props) {
  return (
    <section className="financePage">
      <div className="clientGroup compactGroup">
        <div className="clientGroupHeader compactHeader">
          <div>
            <h3>{title}</h3>
            <p>
              Prix colis jour : {formatAr(stats.dailyColis)} · mois :{" "}
              {formatAr(stats.monthlyColis)}
            </p>
            <p>Bénéfice mois : {formatAr(stats.monthlyProfit)}</p>
          </div>

          <button className="secondaryBtn" onClick={onToggleOpen}>
            {isOpen ? "Fermer" : "Détail"}
          </button>
        </div>

        {isOpen && (
          <div className="groupList">
            <div className="panel">
              <h3>Prix d'achat</h3>

              <div className="financeEntryForm">
                <input
                  type="date"
                  value={formState.date}
                  onChange={(e) =>
                    onFormChange({ ...formState, date: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Prix d'achat"
                  value={formState.amount}
                  onChange={(e) =>
                    onFormChange({ ...formState, amount: e.target.value })
                  }
                />
                <button className="primaryBtn" onClick={onAddPurchase}>
                  Ajouter
                </button>
              </div>

              <textarea
                placeholder="Description achat"
                value={formState.description}
                onChange={(e) =>
                  onFormChange({ ...formState, description: e.target.value })
                }
              />

              <div className="compactList">
                {purchases.filter((p) => isSameMonth(p.date, selectedDate))
                  .length === 0 ? (
                  <div className="emptySmall">Aucun achat.</div>
                ) : (
                  purchases
                    .filter((p) => isSameMonth(p.date, selectedDate))
                    .map((p) => (
                      <div className="compactLineRow" key={p.id}>
                        <span>{p.description || p.date}</span>
                        <strong>{formatAr(p.amount)}</strong>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="panel">
              <h3>Livraisons du jour</h3>
              <div className="compactList">
                {stats.dailyRows.length === 0 ? (
                  <div className="emptySmall">Aucune livraison aujourd'hui.</div>
                ) : (
                  stats.dailyRows.map((d) => (
                    <div className="compactLineRow" key={d.id}>
                      <span>{d.lieu}</span>
                      <strong>{formatAr(d.prix)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
