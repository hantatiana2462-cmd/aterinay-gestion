import { MoneyEntry } from "../types";
import { formatAr } from "../helpers";

type FinanceStats = {
  clientColisNous: number;
  clientColisMvola: number;
  clientColisDirect: number;
  clientFraisNous: number;
  clientFraisMvola: number;
  clientFraisDirect: number;
  autoPrixColis: number;
  autoFraisLivraison: number;
  pomanaiPrixColis: number;
  zazatianaPrixColis: number;
  partnerPrixColis: number;
  pomanaiFraisLivraisonRecu: number;
  zazatianaFraisLivraisonRecu: number;
  partnerFraisLivraisonRecu: number;
  totalRecusClientsFinance: number;
  recoveryAmount: number;
  clientAdjustmentsTotal: number;
  manualGains: number;
  manualExpenses: number;
  totalGains: number;
  totalExpenses: number;
  balance: number;
};

type EntryForm = { label: string; amount: string };

type Props = {
  financeStats: FinanceStats;
  selectedDate: string;
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

function FinanceLine({
  label,
  amount,
  strong = false,
}: {
  label: string;
  amount: number;
  strong?: boolean;
}) {
  const tone =
    amount > 0
      ? "financeLinePositive"
      : amount < 0
        ? "financeLineNegative"
        : "financeLineNeutral";

  return (
    <div className={`financeLine ${tone} ${strong ? "financeLineStrong" : ""}`}>
      <span>{label}</span>
      <strong>{formatAr(amount)}</strong>
    </div>
  );
}

function MoneyList({
  entries,
  emptyLabel,
  selectedDate,
  tone,
  onDelete,
}: {
  entries: MoneyEntry[];
  emptyLabel: string;
  selectedDate: string;
  tone: "gain" | "expense";
  onDelete: (id: number) => void;
}) {
  if (entries.length === 0) {
    return <div className="emptySmall">{emptyLabel}</div>;
  }

  return (
    <div className="list">
      {entries.map((entry) => (
        <div
          className={`moneyItem ${tone === "gain" ? "gainItem" : "expenseItem"}`}
          key={entry.id}
        >
          <div>
            <strong>{entry.label}</strong>
            <small>{(entry.date || selectedDate) + " - " + formatAr(entry.amount)}</small>
          </div>
          <button className="deleteBtn" onClick={() => onDelete(entry.id)}>
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}

export default function FinanceView({
  financeStats,
  selectedDate,
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
  const isPositive = financeStats.balance >= 0;
  const clientEntryTotal =
    financeStats.clientColisNous +
    financeStats.clientColisMvola +
    financeStats.clientFraisNous +
    financeStats.clientFraisMvola +
    financeStats.clientFraisDirect +
    financeStats.recoveryAmount;
  const clientDeductionTotal =
    financeStats.clientAdjustmentsTotal - financeStats.totalRecusClientsFinance;
  const partnerDiversTotal =
    financeStats.partnerPrixColis +
    financeStats.partnerFraisLivraisonRecu +
    financeStats.manualGains -
    financeStats.manualExpenses;

  return (
    <section className="financePage financePageReadable">
      <div className={`financeHero ${isPositive ? "financeHeroPositive" : "financeHeroNegative"}`}>
        <div>
          <span className="financeEyebrow">Finance du jour</span>
          <h2>{formatAr(financeStats.balance)}</h2>
          <p>
            Formule complete, avec les colis clients neutralises et les frais partenaires
            comptes une seule fois.
          </p>
        </div>
        <div className="financeHeroSide">
          <span>{selectedDate}</span>
          <strong>{isPositive ? "Positif" : "Negatif"}</strong>
          <small>Entrees {formatAr(financeStats.totalGains)}</small>
          <small>Sorties {formatAr(financeStats.totalExpenses)}</small>
        </div>
      </div>

      <div className="financeSummaryGrid financeFormulaGrid">
        <div className="financeSummaryPanel gainSummaryPanel">
          <div className="financePanelHeader">
            <span>Clients encaisses</span>
            <strong>{formatAr(clientEntryTotal)}</strong>
          </div>
          <FinanceLine label="+ Colis client chez nous" amount={financeStats.clientColisNous} />
          <FinanceLine label="+ Colis client Mvola" amount={financeStats.clientColisMvola} />
          <FinanceLine label="+ Frais livraison chez nous" amount={financeStats.clientFraisNous} />
          <FinanceLine label="+ Frais livraison Mvola" amount={financeStats.clientFraisMvola} />
          <FinanceLine label="+ Frais direct client" amount={financeStats.clientFraisDirect} />
          <FinanceLine label="+ Recuperation" amount={financeStats.recoveryAmount} />
          <FinanceLine
            label={`0 x colis direct client (${formatAr(financeStats.clientColisDirect)})`}
            amount={0}
          />
        </div>

        <div className="financeSummaryPanel expenseSummaryPanel">
          <div className="financePanelHeader">
            <span>Clients a neutraliser</span>
            <strong>{formatAr(clientDeductionTotal)}</strong>
          </div>
          <FinanceLine label="- Colis client chez nous" amount={-financeStats.clientColisNous} />
          <FinanceLine label="- Colis client Mvola" amount={-financeStats.clientColisMvola} />
          <FinanceLine
            label={`0 x colis direct client (${formatAr(financeStats.clientColisDirect)})`}
            amount={0}
          />
          <FinanceLine
            label="+/- Ajustements clients (sens finance)"
            amount={financeStats.clientAdjustmentsTotal}
            strong
          />
        </div>

        <div className="financeSummaryPanel partnerSummaryPanel">
          <div className="financePanelHeader">
            <span>Partenaires et divers</span>
            <strong>{formatAr(partnerDiversTotal)}</strong>
          </div>
          <FinanceLine label="+ Prix colis partenaires" amount={financeStats.partnerPrixColis} />
          <FinanceLine
            label="+ Frais partenaires recus"
            amount={financeStats.partnerFraisLivraisonRecu}
          />
          <FinanceLine label="+ Autres entrees" amount={financeStats.manualGains} />
          <FinanceLine label="- Autres depenses" amount={-financeStats.manualExpenses} strong />
        </div>
      </div>

      <div className="financeFormula">
        <strong>Calcul utilise</strong>
        <span>
          clients encaisses - colis a reverser + partenaires + ajustements +
          autres entrees - autres depenses = resultat net
        </span>
        <small>
          Les prix colis clients payes chez nous ou par Mvola entrent puis ressortent.
          Les prix colis payes directement au client comptent 0. Les frais directs
          client restent une entree. Les ajustements clients prennent le signe inverse
          du recu client. Les frais partenaires recus sont ajoutes une seule fois.
        </small>
      </div>

      <section className="financeFormsGrid">
        <div className="panel financeActionPanel">
          <div className="financePanelTitleRow">
            <h2>Autres entrees</h2>
            <span>{formatAr(financeStats.manualGains)}</span>
          </div>
          <p className="emptySmall">Enregistrees pour le {selectedDate}</p>

          <div className="financeEntryForm">
            <input
              placeholder="Libelle"
              value={gainForm.label}
              onChange={(e) =>
                onGainFormChange({ ...gainForm, label: e.target.value })
              }
            />
            <input
              inputMode="decimal"
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

          <MoneyList
            entries={otherGains}
            emptyLabel="Aucune entree."
            selectedDate={selectedDate}
            tone="gain"
            onDelete={onDeleteGain}
          />
        </div>

        <div className="panel financeActionPanel">
          <div className="financePanelTitleRow">
            <h2>Autres depenses</h2>
            <span>{formatAr(financeStats.manualExpenses)}</span>
          </div>
          <p className="emptySmall">Enregistrees pour le {selectedDate}</p>

          <div className="financeEntryForm">
            <input
              placeholder="Libelle"
              value={expenseForm.label}
              onChange={(e) =>
                onExpenseFormChange({ ...expenseForm, label: e.target.value })
              }
            />
            <input
              inputMode="decimal"
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

          <MoneyList
            entries={otherExpenses}
            emptyLabel="Aucune depense."
            selectedDate={selectedDate}
            tone="expense"
            onDelete={onDeleteExpense}
          />
        </div>
      </section>
    </section>
  );
}
