import { formatAr } from "../helpers";

type AterinayStats = {
  totalFrais: number;
  totalSalaries: number;
  logistics: number;
  result: number;
};

type Props = {
  aterinayStats: AterinayStats;
};

export default function AterinayView({ aterinayStats }: Props) {
  return (
    <section className="financePage">
      <div className="statsGrid compactStatsGrid">
        <div className="statCard compactStatCard">
          <span>Total frais colis</span>
          <strong>{formatAr(aterinayStats.totalFrais)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Salaire employés</span>
          <strong>{formatAr(aterinayStats.totalSalaries)}</strong>
        </div>
        <div className="statCard compactStatCard">
          <span>Livraisons × 500 Ar</span>
          <strong>{formatAr(aterinayStats.logistics)}</strong>
        </div>
        <div
          className={`statCard compactStatCard ${
            aterinayStats.result >= 0 ? "balancePositive" : "balanceNegative"
          }`}
        >
          <span>Résultat</span>
          <strong>{formatAr(aterinayStats.result)}</strong>
        </div>
      </div>
    </section>
  );
}
