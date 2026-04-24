import { Rider, Delivery, DeliveryStatus, PaymentMode, ClientType } from "../types";
import { formatAr, isPartnerClient } from "../helpers";

type RiderStat = {
  rider: string;
  active: boolean;
  totalLivraisons: number;
  enCours: number;
  nonFaites: number;
  totalRetours: number;
  totalRecu: number;
  totalRestant: number;
};

type GlobalStats = {
  livraisonsFaites: number;
  totalPrixLivraison: number;
  totalPrixColis: number;
  totalGeneral: number;
};

type DeliveryForm = {
  date: string;
  rider: string;
  client: string;
  contact: string;
  clientType: ClientType;
  lieu: string;
  description: string;
  prix: string;
  frais: string;
  status: DeliveryStatus;
  raison: string;
  retours: string;
  colisPayment: PaymentMode;
  fraisPayment: PaymentMode;
};

type Props = {
  riders: Rider[];
  activeRiders: Rider[];
  riderStats: RiderStat[];
  globalStats: GlobalStats;
  deliveries: Delivery[];
  form: DeliveryForm;
  newRiderName: string;
  openAddDelivery: boolean;
  openRiderList: boolean;
  openGlobalDetails: boolean;
  openRiderManagement: boolean;
  onFormChange: (form: DeliveryForm) => void;
  onAddDelivery: () => void;
  onAddRider: () => void;
  onUpdateRiderName: (id: number, name: string) => void;
  onToggleRiderActive: (id: number) => void;
  onMarkAllReceived: (rider: string) => void;
  onNewRiderNameChange: (name: string) => void;
  onSelectRider: (rider: string) => void;
  onToggleAddDelivery: () => void;
  onToggleRiderList: () => void;
  onToggleGlobalDetails: () => void;
  onToggleRiderManagement: () => void;
};

export default function LivreursView({
  riders,
  activeRiders,
  riderStats,
  globalStats,
  deliveries,
  form,
  newRiderName,
  openAddDelivery,
  openRiderList,
  openGlobalDetails,
  openRiderManagement,
  onFormChange,
  onAddDelivery,
  onAddRider,
  onUpdateRiderName,
  onToggleRiderActive,
  onMarkAllReceived,
  onNewRiderNameChange,
  onSelectRider,
  onToggleAddDelivery,
  onToggleRiderList,
  onToggleGlobalDetails,
  onToggleRiderManagement,
}: Props) {
  const existingPlaces = [...new Set(deliveries.map((d) => d.lieu).filter(Boolean))];
  return (
    <>
      <section className="panel collapsiblePanel">
        <div className="panelHeaderRow">
          <h2>Ajouter</h2>
          <button className="secondaryBtn" onClick={onToggleAddDelivery}>
            {openAddDelivery ? "Fermer" : "Ouvrir"}
          </button>
        </div>

        {openAddDelivery && (
          <div className="formGrid">
            <input
              type="date"
              value={form.date}
              onChange={(e) => onFormChange({ ...form, date: e.target.value })}
            />

            <select
              value={form.rider}
              onChange={(e) => onFormChange({ ...form, rider: e.target.value })}
            >
              {activeRiders.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

          <input
  id="client"
  placeholder="Nom du client"
  value={form.client}
  onChange={(e) => {
    const v = e.target.value;
    onFormChange({
      ...form,
      client: v,
      clientType: isPartnerClient(v) ? "entreprise" : form.clientType,
    });
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("contact")?.focus();
    }
  }}
/>

<input
  id="contact"
  placeholder="Contact client (03XXXXXXXX)"
  value={form.contact}
  onChange={(e) => onFormChange({ ...form, contact: e.target.value })}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("lieu")?.focus();
    }
  }}
/>

            <select
              value={form.clientType}
              onChange={(e) =>
                onFormChange({ ...form, clientType: e.target.value as ClientType })
              }
            >
              <option value="normal">Client normal</option>
              <option value="entreprise">Entreprise partenaire</option>
            </select>

            <input
  id="lieu"
  list="lieux-list"
  placeholder="Lieu"
  value={form.lieu}
  onChange={(e) => onFormChange({ ...form, lieu: e.target.value })}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("prix")?.focus();
    }
  }}
/>

<datalist id="lieux-list">
  {existingPlaces.map((lieu) => (
    <option key={lieu} value={lieu} />
  ))}
</datalist>
            
            <input
  id="description"
  placeholder="Description"
  value={form.description}
  onChange={(e) => onFormChange({ ...form, description: e.target.value })}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddDelivery();
    }
  }}
/>

            <input
  id="prix"
  type="number"
  placeholder="Prix colis"
  value={form.prix}
  onChange={(e) => onFormChange({ ...form, prix: e.target.value })}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("frais")?.focus();
    }
  }}
/>

            <input
  id="frais"
  type="number"
  placeholder="Frais livraison"
  value={form.frais}
  onChange={(e) => onFormChange({ ...form, frais: e.target.value })}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("description")?.focus();
    }
  }}
/>

            <select
              value={form.colisPayment}
              onChange={(e) =>
                onFormChange({ ...form, colisPayment: e.target.value as PaymentMode })
              }
            >
              <option value="nous">Colis payé chez nous</option>
              <option value="mobile_money_nous">Colis payé par Mvola chez nous</option>
              <option value="direct_client">Colis payé directement au client</option>
            </select>

            <select
              value={form.fraisPayment}
              onChange={(e) =>
                onFormChange({ ...form, fraisPayment: e.target.value as PaymentMode })
              }
            >
              <option value="nous">Frais payé chez nous</option>
              <option value="mobile_money_nous">Frais payé par Mvola chez nous</option>
              <option value="direct_client">Frais payé directement chez le client</option>
            </select>

            <select
              value={form.status}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  status: e.target.value as DeliveryStatus,
                  raison: e.target.value === "non_faite" ? form.raison : "",
                  retours:
                    e.target.value === "non_faite"
                      ? "1"
                      : e.target.value === "en_cours"
                        ? "0"
                        : form.retours,
                })
              }
            >
              <option value="faite">Faite</option>
              <option value="en_cours">En cours</option>
              <option value="non_faite">Non faite</option>
            </select>

            {form.status === "faite" && (
              <input
                type="number"
                min="0"
                placeholder="Nombre de retours"
                value={form.retours}
                onChange={(e) => onFormChange({ ...form, retours: e.target.value })}
              />
            )}

            {form.status === "non_faite" && (
              <input
                placeholder="Raison de non livraison"
                value={form.raison}
                onChange={(e) => onFormChange({ ...form, raison: e.target.value })}
              />
            )}

            <button className="primaryBtn" onClick={onAddDelivery}>
              Ajouter
            </button>
          </div>
        )}
      </section>

      <section className="panel collapsiblePanel">
        <div className="panelHeaderRow">
          <h2>Liste des livreurs</h2>
          <button className="secondaryBtn" onClick={onToggleRiderList}>
            {openRiderList ? "Fermer" : "Ouvrir"}
          </button>
        </div>

        {openRiderList && (
          <div className="groupList">
            {riderStats.filter((group) => group.active).map((group) => (
              <div className="riderGroup compactGroup riderGroupEnhanced" key={group.rider}>
                <div className="riderGroupHeader compactHeader riderHeaderEnhanced">
                  <div className="riderHeaderMain">
                    <h3>
                      {group.rider}
                      <span className={group.active ? "statusActive" : "statusInactive"}>
                        {group.active ? "Actif" : "Inactif"}
                      </span>
                    </h3>

                    <div className="riderMetricsRow">
                      <div className="metricChip metricChipDone">
                        <span className="metricLabel">Colis faits</span>
                        <strong>{group.totalLivraisons}</strong>
                      </div>

                      <div className="metricChip metricChipRetour">
                        <span className="metricLabel">Retours</span>
                        <strong>{group.totalRetours}</strong>
                      </div>

                      <div className="metricChip metricChipCancelled">
                        <span className="metricLabel">Non faits</span>
                        <strong>{group.nonFaites}</strong>
                      </div>
                    </div>

                    <p className="riderMoneyLine">
                      Reçu : <strong>{formatAr(group.totalRecu)}</strong>
                      <span className="riderMoneyDivider">•</span>
                      Restant : <strong>{formatAr(group.totalRestant)}</strong>
                    </p>
                  </div>

                  <div className="actionGroup riderHeaderActions">
                    <button
                      className="primaryBtn"
                      onClick={() => onMarkAllReceived(group.rider)}
                    >
                      Tout reçu
                    </button>
                    <button
                      className="secondaryBtn"
                      onClick={() => onSelectRider(group.rider)}
                    >
                      Détail
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel collapsiblePanel">
        <div className="panelHeaderRow">
          <h2>Détails généraux des livraisons</h2>
          <button className="secondaryBtn" onClick={onToggleGlobalDetails}>
            {openGlobalDetails ? "Fermer" : "Ouvrir"}
          </button>
        </div>

        {openGlobalDetails && (
          <div className="statsGrid compactStatsGrid">
            <div className="statCard compactStatCard">
              <span>Livraisons faites</span>
              <strong>{globalStats.livraisonsFaites}</strong>
            </div>
            <div className="statCard compactStatCard">
              <span>Prix de livraison</span>
              <strong>{formatAr(globalStats.totalPrixLivraison)}</strong>
            </div>
            <div className="statCard compactStatCard">
              <span>Frais de colis</span>
              <strong>{formatAr(globalStats.totalPrixColis)}</strong>
            </div>
            <div className="statCard compactStatCard totalCard">
              <span>Total général</span>
              <strong>{formatAr(globalStats.totalGeneral)}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="panel collapsiblePanel">
        <div className="panelHeaderRow">
          <h2>Gestion des livreurs</h2>
          <button className="secondaryBtn" onClick={onToggleRiderManagement}>
            {openRiderManagement ? "Fermer" : "Ouvrir"}
          </button>
        </div>

        {openRiderManagement && (
          <>
            <div className="riderAddBox">
              <input
                type="text"
                placeholder="Nom du nouveau livreur"
                value={newRiderName}
                onChange={(e) => onNewRiderNameChange(e.target.value)}
              />
              <button className="primaryBtn" onClick={onAddRider}>
                Ajouter livreur
              </button>
            </div>

            <div className="list">
              {riders.map((r) => (
                <div className="riderCard" key={r.id}>
                  <div className="riderTopRow">
                    <strong>{r.name}</strong>
                    <span className={r.active ? "statusActive" : "statusInactive"}>
                      {r.active ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <input
                    value={r.name}
                    onChange={(e) => onUpdateRiderName(r.id, e.target.value)}
                  />

                  <button
                    className="secondaryBtn"
                    onClick={() => onToggleRiderActive(r.id)}
                  >
                    {r.active ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}


