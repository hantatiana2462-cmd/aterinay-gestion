import { SalaryAdvance } from "../types";
import { formatAr } from "../helpers";

type PayrollStat = {
  rider: string;
  baseSalary: number;
  advances: SalaryAdvance[];
  recoveries: number;
  advancesTotal: number;
  recoveryAmount: number;
  totalSalary: number;
};

type AdvanceForm = { label: string; amount: string };

type Props = {
  payrollStats: PayrollStat[];
  totalSalaries: number;
  openSalaryRider: string | null;
  advanceForms: Record<string, AdvanceForm>;
  baseSalaryInputs: Record<string, string>;
  onToggleRider: (rider: string) => void;
  onBaseSalaryChange: (rider: string, value: string) => void;
  onUpdateBaseSalary: (rider: string, amount: number) => void;
  onAddRecovery: (rider: string) => void;
  onRemoveRecovery: (rider: string) => void;
  onAdvanceFormChange: (rider: string, field: "label" | "amount", value: string) => void;
  onAddAdvance: (rider: string) => void;
  onDeleteAdvance: (rider: string, advanceId: number) => void;
};

export default function SalairesView({
  payrollStats,
  totalSalaries,
  openSalaryRider,
  advanceForms,
  baseSalaryInputs,
  onToggleRider,
  onBaseSalaryChange,
  onUpdateBaseSalary,
  onAddRecovery,
  onRemoveRecovery,
  onAdvanceFormChange,
  onAddAdvance,
  onDeleteAdvance,
}: Props) {
  return (
    <section className="financePage">
      <div className="statsGrid compactStatsGrid">
        <div className="statCard compactStatCard">
          <span>Total salaires</span>
          <strong>{formatAr(totalSalaries)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Livreurs</span>
          <strong>{payrollStats.length}</strong>
        </div>
      </div>

      <section className="panel">
        <h2>Salaires</h2>

        <div className="groupList">
          {payrollStats.map((p) => {
            const isOpen = openSalaryRider === p.rider;
            const advanceForm = advanceForms[p.rider] || { label: "", amount: "" };

            return (
              <div className="riderGroup compactGroup" key={p.rider}>
                <div className="riderGroupHeader compactHeader">
                  <div>
                    <h3>{p.rider}</h3>
                    <p>
                      Salaire : {formatAr(p.baseSalary)} ·
                      Avance : {formatAr(p.advancesTotal)}
                    </p>
                    <p>
                      Récupérations : {p.recoveries} · Total :{" "}
                      {formatAr(p.totalSalary)}
                    </p>
                  </div>

                  <button
                    className="secondaryBtn"
                    onClick={() => onToggleRider(p.rider)}
                  >
                    {isOpen ? "Fermer" : "Détail"}
                  </button>
                </div>

                {isOpen && (
                  <div className="groupList">
                    <div className="editGrid">
                      <input
                        type="number"
                        placeholder="Salaire global"
                        value={baseSalaryInputs[p.rider] ?? String(p.baseSalary)}
                        onChange={(e) =>
                          onBaseSalaryChange(p.rider, e.target.value)
                        }
                      />
                      <button
                        className="primaryBtn"
                        onClick={() =>
                          onUpdateBaseSalary(
                            p.rider,
                            Number(baseSalaryInputs[p.rider] ?? p.baseSalary)
                          )
                        }
                      >
                        Enregistrer
                      </button>
                      <div className="emptySlot"></div>
                    </div>

                    <div className="paymentRow">
                      <span>Compteur récupération : {p.recoveries}</span>
                      <div className="actionGroup">
                        <button
                          className="secondaryBtn"
                          onClick={() => onRemoveRecovery(p.rider)}
                        >
                          -1
                        </button>
                        <button
                          className="primaryBtn"
                          onClick={() => onAddRecovery(p.rider)}
                        >
                          +1 récupération
                        </button>
                      </div>
                    </div>

                    <div className="financeEntryForm">
                      <input
                        placeholder="Description avance"
                        value={advanceForm.label}
                        onChange={(e) =>
                          onAdvanceFormChange(p.rider, "label", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Montant avance"
                        value={advanceForm.amount}
                        onChange={(e) =>
                          onAdvanceFormChange(p.rider, "amount", e.target.value)
                        }
                      />
                      <button
                        className="primaryBtn"
                        onClick={() => onAddAdvance(p.rider)}
                      >
                        Ajouter avance
                      </button>
                    </div>

                    <div className="list">
                      {p.advances.length === 0 ? (
                        <div className="emptySmall">Aucune avance.</div>
                      ) : (
                        p.advances.map((a) => (
                          <div className="moneyItem expenseItem" key={a.id}>
                            <div>
                              <strong>{a.label}</strong>
                              <small>{formatAr(a.amount)}</small>
                            </div>
                            <button
                              className="deleteBtn"
                              onClick={() => onDeleteAdvance(p.rider, a.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
