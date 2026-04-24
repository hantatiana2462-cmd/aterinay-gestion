import { MoneyEntry } from "../types";
import { formatAr } from "../helpers";

type FinanceStats = {
  autoPrixColis: number;
  autoFraisLivraison: number;
  pomanaiPrixColis: number;
  zazatianaPrixColis: number;
  totalRecusClientsFinance: number;
  balance: number;
};

type EntryForm = { label: string; amount: string };

type Props = {
  financeStats: FinanceStats;
  otherGains: MoneyEntry[];
  otherExpenses: MoneyEntry[];
  gainForm: EntryForm;
  expenseForm: EntryForm;
  onGainFormChange: (form: EntryForm) => void;
  onExpenseFormChange: (form: EntryForm) => void;
  onAddGain: () => void;
  onDeleteGain: (id: number) => void;
  onAddExpense: () => void;
  onDeleteExpense: (id: number) => void;
};

export default function FinanceView({
  financeStats,
  otherGains,
  otherExpenses,
  gainForm,
  expenseForm,
  onGainFormChange,
  onExpenseFormChange,
  onAddGain,
  onDeleteGain,
  onAddExpense,
  onDeleteExpense,
}: Props) {
  return (
    <section className="financePage">
      <div className="statsGrid compactStatsGrid">
        <div className="statCard compactStatCard">
          <span>Prix colis clients</span>
          <strong>{formatAr(financeStats.autoPrixColis)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Frais livraison clients</span>
          <strong>{formatAr(financeStats.autoFraisLivraison)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Prix colis POMANAI</span>
          <strong>{formatAr(financeStats.pomanaiPrixColis)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Prix colis ZAZATIANA</span>
          <strong>{formatAr(financeStats.zazatianaPrixColis)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Reçus clients</span>
          <strong>{formatAr(financeStats.totalRecusClientsFinance)}</strong>
        </div>
        <div
          className={`statCard compactStatCard ${
            financeStats.balance >= 0 ? "balancePositive" : "balanceNegative"
          }`}
        >
          <span>Résultat net</span>
          <strong>{formatAr(financeStats.balance)}</strong>
        </div>
      </div>

      <section className="twoCols financeCols">
        <div className="panel">
          <h2>Autres entrées</h2>

          <div className="financeEntryForm">
            <input
              placeholder="Libellé"
              value={gainForm.label}
              onChange={(e) =>
                onGainFormChange({ ...gainForm, label: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Montant"
              value={gainForm.amount}
              onChange={(e) =>
                onGainFormChange({ ...gainForm, amount: e.target.value })
              }
            />
            <button className="primaryBtn" onClick={onAddGain}>
              Ajouter
            </button>
          </div>

          <div className="list">
            {otherGains.length === 0 ? (
              <div className="emptySmall">Aucune entrée.</div>
            ) : (
              otherGains.map((g) => (
                <div className="moneyItem gainItem" key={g.id}>
                  <div>
                    <strong>{g.label}</strong>
                    <small>{formatAr(g.amount)}</small>
                  </div>
                  <button
                    className="deleteBtn"
                    onClick={() => onDeleteGain(g.id)}
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <h2>Autres dépenses</h2>

          <div className="financeEntryForm">
            <input
              placeholder="Libellé"
              value={expenseForm.label}
              onChange={(e) =>
                onExpenseFormChange({ ...expenseForm, label: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Montant"
              value={expenseForm.amount}
              onChange={(e) =>
                onExpenseFormChange({ ...expenseForm, amount: e.target.value })
              }
            />
            <button className="primaryBtn" onClick={onAddExpense}>
              Ajouter
            </button>
          </div>

          <div className="list">
            {otherExpenses.length === 0 ? (
              <div className="emptySmall">Aucune dépense.</div>
            ) : (
              otherExpenses.map((e) => (
                <div className="moneyItem expenseItem" key={e.id}>
                  <div>
                    <strong>{e.label}</strong>
                    <small>{formatAr(e.amount)}</small>
                  </div>
                  <button
                    className="deleteBtn"
                    onClick={() => onDeleteExpense(e.id)}
                  >
                    Supprimer
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
