import { formatAr } from "../helpers";

type AterinayStats = {
  totalFrais: number;
  totalDeliveries: number;
  manualGains: number;
  manualExpenses: number;
  totalSalaries: number;
  logistics: number;
  result: number;
};

type Props = {
  aterinayStats: AterinayStats;
};

export default function AterinayView({ aterinayStats }: Props) {
  const beforeSalaries =
    aterinayStats.totalFrais +
    aterinayStats.manualGains -
    aterinayStats.logistics -
    aterinayStats.manualExpenses;

  return (
    <section className="financePage">
      <div className="statsGrid compactStatsGrid">
        <div className="statCard compactStatCard">
          <span>Livraisons faites</span>
          <strong>{aterinayStats.totalDeliveries}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Total frais livraison</span>
          <strong>{formatAr(aterinayStats.totalFrais)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Charge logistique</span>
          <strong>{formatAr(aterinayStats.logistics)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Salaires employes</span>
          <strong>{formatAr(aterinayStats.totalSalaries)}</strong>
        </div>
        <div className="statCard compactStatCard gainCard">
          <span>Autres entrees</span>
          <strong>{formatAr(aterinayStats.manualGains)}</strong>
        </div>
        <div className="statCard compactStatCard expenseCard">
          <span>Autres depenses</span>
          <strong>{formatAr(aterinayStats.manualExpenses)}</strong>
        </div>
        <div
          className={`statCard compactStatCard ${
            beforeSalaries >= 0 ? "gainCard" : "expenseCard"
          }`}
        >
          <span>Avant salaires</span>
          <strong>{formatAr(beforeSalaries)}</strong>
        </div>
        <div
          className={`statCard compactStatCard ${
            aterinayStats.result >= 0 ? "balancePositive" : "balanceNegative"
          }`}
        >
          <span>Resultat net</span>
          <strong>{formatAr(aterinayStats.result)}</strong>
        </div>
      </div>

      <section className="panel">
        <h2>Bilan ATERINAY du jour</h2>
        <div className="deliveryTableWrap">
          <table className="deliveryTable">
            <thead>
              <tr>
                <th>Element</th>
                <th>Calcul</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Frais livraison encaissables</td>
                <td>Somme des frais des livraisons faites</td>
                <td>{formatAr(aterinayStats.totalFrais)}</td>
              </tr>
              <tr>
                <td>Autres entrees</td>
                <td>Entrees ajoutees sur la date selectionnee</td>
                <td>{formatAr(aterinayStats.manualGains)}</td>
              </tr>
              <tr>
                <td>Autres depenses</td>
                <td>Depenses ajoutees sur la date selectionnee</td>
                <td>- {formatAr(aterinayStats.manualExpenses)}</td>
              </tr>
              <tr>
                <td>Charge logistique</td>
                <td>{aterinayStats.totalDeliveries} livraisons x 500 Ar</td>
                <td>- {formatAr(aterinayStats.logistics)}</td>
              </tr>
              <tr>
                <td>Salaires</td>
                <td>Total net des fiches salaires</td>
                <td>- {formatAr(aterinayStats.totalSalaries)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Resultat net</strong>
                </td>
                <td>Frais + entrees - depenses - logistique - salaires</td>
                <td>
                  <strong>{formatAr(aterinayStats.result)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
