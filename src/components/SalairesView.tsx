import { RiderPayroll, SalaryAdvance } from "../types";
import { formatAr, normalizeAriaryInput } from "../helpers";
import {
  generatePayrollSlipPdf,
  generatePayrollSlipTicketPdf,
  generatePayrollSummaryPdf,
} from "../utils/payrollPdf";

type PayrollStat = RiderPayroll & {
  advances: SalaryAdvance[];
  advancesTotal: number;
  recoveryAmount: number;
  totalSalary: number;
};

type AdvanceForm = { label: string; amount: string };
type PayrollInfoField =
  | "fullName"
  | "cin"
  | "role"
  | "periodStart"
  | "periodEnd"
  | "paymentDate"
  | "paymentMethod"
  | "paymentReference"
  | "notes";

type Props = {
  payrollStats: PayrollStat[];
  totalSalaries: number;
  openSalaryRider: string | null;
  advanceForms: Record<string, AdvanceForm>;
  baseSalaryInputs: Record<string, string>;
  onToggleRider: (rider: string) => void;
  onBaseSalaryChange: (rider: string, value: string) => void;
  onUpdateBaseSalary: (rider: string, amount: number) => void;
  onPayrollInfoChange: (
    rider: string,
    field: PayrollInfoField,
    value: string
  ) => void;
  onAddRecovery: (rider: string) => void;
  onRemoveRecovery: (rider: string) => void;
  onAdvanceFormChange: (
    rider: string,
    field: "label" | "amount",
    value: string
  ) => void;
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
  onPayrollInfoChange,
  onAddRecovery,
  onRemoveRecovery,
  onAdvanceFormChange,
  onAddAdvance,
  onDeleteAdvance,
}: Props) {
  const totalBase = payrollStats.reduce((sum, p) => sum + p.baseSalary, 0);
  const totalAdvances = payrollStats.reduce((sum, p) => sum + p.advancesTotal, 0);
  const totalRecoveries = payrollStats.reduce(
    (sum, p) => sum + p.recoveryAmount,
    0
  );

  return (
    <section className="financePage">
      <div className="statsGrid compactStatsGrid">
        <div className="statCard compactStatCard">
          <span>Total net a payer</span>
          <strong>{formatAr(totalSalaries)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Salaires de base</span>
          <strong>{formatAr(totalBase)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Recuperations</span>
          <strong>{formatAr(totalRecoveries)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Avances deduites</span>
          <strong>{formatAr(totalAdvances)}</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panelHeaderRow">
          <h2>Gestion des salaires</h2>
          <button
            className="secondaryBtn"
            type="button"
            onClick={() =>
              generatePayrollSummaryPdf({ payrollStats, totalSalaries })
            }
          >
            PDF global
          </button>
        </div>

        <div className="salaryMobileList">
          {payrollStats.map((p) => (
            <article className="salaryMobileCard" key={p.rider}>
              <div>
                <strong>{p.fullName || p.rider}</strong>
                <span>{p.role || "Livreur"}</span>
              </div>

              <div className="salaryMobileGrid">
                <span>Base <strong>{formatAr(p.baseSalary)}</strong></span>
                <span>Recup. <strong>{formatAr(p.recoveryAmount)}</strong></span>
                <span>Avances <strong>{formatAr(p.advancesTotal)}</strong></span>
                <span>Net <strong>{formatAr(p.totalSalary)}</strong></span>
              </div>

              <div className="salaryMobileActions">
                <button
                  className="primaryBtn"
                  type="button"
                  onClick={() => generatePayrollSlipPdf(p)}
                >
                  Fiche PDF
                </button>
                <button
                  className="secondaryBtn"
                  type="button"
                  onClick={() => generatePayrollSlipTicketPdf(p)}
                >
                  Ticket 80mm
                </button>
                <button
                  className="secondaryBtn"
                  type="button"
                  onClick={() => onToggleRider(p.rider)}
                >
                  {openSalaryRider === p.rider ? "Fermer" : "Dossier"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="deliveryTableWrap salaryDesktopTable">
          <table className="deliveryTable">
            <thead>
              <tr>
                <th>Employe</th>
                <th>Base</th>
                <th>Recup.</th>
                <th>Avances</th>
                <th>Net</th>
                <th>Reception</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payrollStats.map((p) => (
                <tr key={p.rider}>
                  <td>
                    <strong>{p.fullName || p.rider}</strong>
                    <div className="deliveryDescription">{p.role || "Livreur"}</div>
                  </td>
                  <td>{formatAr(p.baseSalary)}</td>
                  <td>{formatAr(p.recoveryAmount)}</td>
                  <td>{formatAr(p.advancesTotal)}</td>
                  <td>
                    <strong>{formatAr(p.totalSalary)}</strong>
                  </td>
                  <td>{p.paymentDate || "-"}</td>
                  <td>
                    <button
                      className="secondaryBtn"
                      type="button"
                      onClick={() => onToggleRider(p.rider)}
                    >
                      {openSalaryRider === p.rider ? "Fermer" : "Dossier"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="groupList" style={{ marginTop: 18 }}>
          {payrollStats.map((p) => {
            const isOpen = openSalaryRider === p.rider;
            const advanceForm = advanceForms[p.rider] || { label: "", amount: "" };
            const salaryInput = baseSalaryInputs[p.rider] ?? String(p.baseSalary);

            if (!isOpen) return null;

            return (
              <div className="riderGroup compactGroup" key={p.rider}>
                <div className="riderGroupHeader compactHeader">
                  <div>
                    <h3>{p.fullName || p.rider}</h3>
                    <p>
                      Net a payer : <strong>{formatAr(p.totalSalary)}</strong> ·{" "}
                      Date reception : {p.paymentDate || "non renseignee"}
                    </p>
                  </div>
                  <div className="actionGroup">
                    <button
                      className="primaryBtn"
                      type="button"
                      onClick={() => generatePayrollSlipPdf(p)}
                    >
                      Fiche PDF
                    </button>
                    <button
                      className="secondaryBtn"
                      type="button"
                      onClick={() => generatePayrollSlipTicketPdf(p)}
                    >
                      Ticket 80mm
                    </button>
                    <button
                      className="secondaryBtn"
                      type="button"
                      onClick={() => onToggleRider(p.rider)}
                    >
                      Fermer
                    </button>
                  </div>
                </div>

                <div className="editGrid">
                  <div className="fieldBlock">
                    <label>Nom complet</label>
                    <input
                      value={p.fullName || ""}
                      placeholder="Nom et prenom"
                      onChange={(e) =>
                        onPayrollInfoChange(p.rider, "fullName", e.target.value)
                      }
                    />
                  </div>
                  <div className="fieldBlock">
                    <label>Numero CIN</label>
                    <input
                      value={p.cin || ""}
                      placeholder="Ex: 101 000 000 000"
                      onChange={(e) =>
                        onPayrollInfoChange(p.rider, "cin", e.target.value)
                      }
                    />
                  </div>
                  <div className="fieldBlock">
                    <label>Poste</label>
                    <input
                      value={p.role || ""}
                      placeholder="Livreur"
                      onChange={(e) =>
                        onPayrollInfoChange(p.rider, "role", e.target.value)
                      }
                    />
                  </div>
                  <div className="fieldBlock">
                    <label>Mode de paiement</label>
                    <select
                      value={p.paymentMethod || "Especes"}
                      onChange={(e) =>
                        onPayrollInfoChange(
                          p.rider,
                          "paymentMethod",
                          e.target.value
                        )
                      }
                    >
                      <option value="Especes">Especes</option>
                      <option value="Mobile money">Mobile money</option>
                      <option value="Virement">Virement</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="editGrid">
                  <div className="fieldBlock">
                    <label>Debut periode</label>
                    <input
                      type="date"
                      value={p.periodStart || ""}
                      onChange={(e) =>
                        onPayrollInfoChange(
                          p.rider,
                          "periodStart",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="fieldBlock">
                    <label>Fin periode</label>
                    <input
                      type="date"
                      value={p.periodEnd || ""}
                      onChange={(e) =>
                        onPayrollInfoChange(p.rider, "periodEnd", e.target.value)
                      }
                    />
                  </div>
                  <div className="fieldBlock">
                    <label>Date de reception</label>
                    <input
                      type="date"
                      value={p.paymentDate || ""}
                      onChange={(e) =>
                        onPayrollInfoChange(
                          p.rider,
                          "paymentDate",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="editGrid">
                  <div className="fieldBlock">
                    <label>Salaire global</label>
                    <input
                      inputMode="decimal"
                      placeholder="Ex: 150 ou 150000"
                      value={salaryInput}
                      onChange={(e) => onBaseSalaryChange(p.rider, e.target.value)}
                    />
                  </div>
                  <div className="fieldBlock">
                    <label>Reference paiement</label>
                    <input
                      value={p.paymentReference || ""}
                      placeholder="Numero recu, transaction..."
                      onChange={(e) =>
                        onPayrollInfoChange(
                          p.rider,
                          "paymentReference",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <button
                    className="primaryBtn"
                    type="button"
                    onClick={() =>
                      onUpdateBaseSalary(
                        p.rider,
                        Number(normalizeAriaryInput(salaryInput) || 0)
                      )
                    }
                  >
                    Enregistrer salaire
                  </button>
                </div>

                <div className="statsGrid compactStatsGrid">
                  <div className="statCard compactStatCard">
                    <span>Base</span>
                    <strong>{formatAr(p.baseSalary)}</strong>
                  </div>
                  <div className="statCard compactStatCard">
                    <span>Recuperations</span>
                    <strong>{formatAr(p.recoveryAmount)}</strong>
                  </div>
                  <div className="statCard compactStatCard">
                    <span>Avances</span>
                    <strong>{formatAr(p.advancesTotal)}</strong>
                  </div>
                  <div className="statCard compactStatCard totalCard">
                    <span>Net a payer</span>
                    <strong>{formatAr(p.totalSalary)}</strong>
                  </div>
                </div>

                <div className="paymentRow">
                  <span>Compteur recuperation : {p.recoveries}</span>
                  <div className="actionGroup">
                    <button
                      className="secondaryBtn"
                      type="button"
                      onClick={() => onRemoveRecovery(p.rider)}
                    >
                      -1
                    </button>
                    <button
                      className="primaryBtn"
                      type="button"
                      onClick={() => onAddRecovery(p.rider)}
                    >
                      +1 recuperation
                    </button>
                  </div>
                </div>

                <div className="financeEntryForm">
                  <input
                    placeholder="Libelle avance"
                    value={advanceForm.label}
                    onChange={(e) =>
                      onAdvanceFormChange(p.rider, "label", e.target.value)
                    }
                  />
                  <input
                    inputMode="decimal"
                    placeholder="Montant avance"
                    value={advanceForm.amount}
                    onChange={(e) =>
                      onAdvanceFormChange(p.rider, "amount", e.target.value)
                    }
                  />
                  <button
                    className="primaryBtn"
                    type="button"
                    onClick={() => onAddAdvance(p.rider)}
                  >
                    Ajouter avance
                  </button>
                </div>

                <textarea
                  placeholder="Notes internes ou observation sur le paiement"
                  value={p.notes || ""}
                  onChange={(e) =>
                    onPayrollInfoChange(p.rider, "notes", e.target.value)
                  }
                />

                <div className="list">
                  {p.advances.length === 0 ? (
                    <div className="emptySmall">Aucune avance.</div>
                  ) : (
                    p.advances.map((a) => (
                      <div className="moneyItem expenseItem" key={a.id}>
                        <div>
                          <strong>{a.label}</strong>
                          <small>
                            {(a.date || "Sans date") + " · " + formatAr(a.amount)}
                          </small>
                        </div>
                        <button
                          className="deleteBtn"
                          type="button"
                          onClick={() => onDeleteAdvance(p.rider, a.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
