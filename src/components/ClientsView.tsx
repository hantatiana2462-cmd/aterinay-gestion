import { formatAr } from "../helpers";
import DeliveryTable from "./DeliveryTable";
import ClientReceiptView from "./ClientReceiptView";
import { Delivery, ClientAdjustment } from "../types";
import { useState } from "react";

type ClientStat = {
  client: string;
  rows: Delivery[];
  totalFaits: number;
  totalRetours: number;
  totalReceipts: number;
};

type ClientGroup = ClientStat;

type ClientsListProps = {
  clientStats: ClientStat[];
  totalRecusClients: number;
  openClientList: boolean;
  onToggleList: () => void;
  onSelectClient: (client: string) => void;
};

export function ClientsView({
  clientStats,
  totalRecusClients,
  openClientList,
  onToggleList,
  onSelectClient,
}: ClientsListProps) {
  return (
    <section className="panel collapsiblePanel">
      <div className="panelHeaderRow">
        <h2>Recus clients</h2>
        <button className="secondaryBtn" onClick={onToggleList}>
          {openClientList ? "Fermer" : "Ouvrir"}
        </button>
      </div>

      <div className="inlineSummaryBar clientInlineSummaryBar">
        <span className="inlineSummaryItem inlineSummaryMoney">
          Total recu: <strong>{formatAr(totalRecusClients)}</strong>
        </span>
      </div>

      {openClientList && (
        <div className="groupList">
          {clientStats.length === 0 ? (
            <div className="empty">Aucun client trouve.</div>
          ) : (
            clientStats.map((client) => (
              <div className="clientGroup compactGroup" key={client.client}>
                <div className="clientGroupHeader compactHeader">
                  <div>
                    <h3>{client.client}</h3>
                    <p className="compactInlineMeta">
                      <span className="inlineSummaryItem inlineSummaryDone">
                        Faites: <strong>{client.totalFaits}</strong>
                      </span>
                      <span className="inlineSlash">/</span>
                      <span className="inlineSummaryItem inlineSummaryReturn">
                        Retours: <strong>{client.totalRetours}</strong>
                      </span>
                      <span className="inlineSlash">/</span>
                      <span className="inlineSummaryItem inlineSummaryMoney">
                        Recu: <strong>{formatAr(client.totalReceipts)}</strong>
                      </span>
                    </p>
                  </div>

                  <div className="actionGroup">
                    <button
                      className="secondaryBtn"
                      onClick={() => onSelectClient(client.client)}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

type ClientDetailProps = {
  selectedClientGroup: ClientGroup | null;
  clientAdjustments: ClientAdjustment[];
  setClientAdjustments: React.Dispatch<React.SetStateAction<ClientAdjustment[]>>;
  openDeliveryId: number | null;
  onBack: () => void;
  onToggleOpen: (id: number) => void;
  onUpdateField: (id: number, field: keyof Delivery, value: string | number) => void;
  onTogglePayment: (id: number) => void;
  onDelete: (id: number) => void;
};

export function ClientDetails({
  selectedClientGroup,
  clientAdjustments,
  setClientAdjustments,
  openDeliveryId,
  onBack,
  onToggleOpen,
  onUpdateField,
  onTogglePayment,
  onDelete,
}: ClientDetailProps) { 
  const [adjustmentLabel, setAdjustmentLabel] = useState("");
const [adjustmentAmount, setAdjustmentAmount] = useState("");
  return (
    <section className="panel compactDetailPage">
      <div className="panelHeaderRow">
        <h2>{selectedClientGroup ? selectedClientGroup.client : "Client"}</h2>
        <button className="secondaryBtn" onClick={onBack}>
          Retour
        </button>
      </div>

      {selectedClientGroup ? (
        <>
          <div className="detailInlineStats clientDetailInlineStats">
            <span className="statItem statDone">
              Faites: <strong>{selectedClientGroup.totalFaits}</strong>
            </span>
            <span className="separator">/</span>
            <span className="statItem statReturn">
              Retours: <strong>{selectedClientGroup.totalRetours}</strong>
            </span>
            <span className="separator">/</span>
            <span className="statItem statMoney">
              Total recu: <strong>{formatAr(selectedClientGroup.totalReceipts)}</strong>
            </span>
          </div>


          <div className="clientAdjustmentForm">
  <h3>Ajouter un ajustement</h3>

  <div className="clientAdjustmentInputs">
    <input
      type="text"
      placeholder="Libellé (ex: frais récupération)"
      value={adjustmentLabel}
      onChange={(e) => setAdjustmentLabel(e.target.value)}
    />

    <input
      type="number"
      placeholder="Montant (+ ou -)"
      value={adjustmentAmount}
      onChange={(e) => setAdjustmentAmount(e.target.value)}
    />

    <button
      className="primaryBtn"
      type="button"
      onClick={() => {
        if (!selectedClientGroup) return;
        if (!adjustmentLabel.trim()) return;
        if (!adjustmentAmount) return;

        const amount = Number(adjustmentAmount);

        setClientAdjustments((prev) => [
          ...prev,
          {
            id: Date.now(),
            client: selectedClientGroup.client,
            date: new Date().toISOString().slice(0, 10),
            label: adjustmentLabel.trim(),
            type: amount < 0 ? "deduction" : "report",
            amount,
          },
        ]);

        setAdjustmentLabel("");
        setAdjustmentAmount("");
      }}
    >
      Ajouter
    </button>
  </div>
</div>
          <ClientReceiptView
  clientName={selectedClientGroup.client}
  deliveries={selectedClientGroup.rows}
  adjustments={clientAdjustments}
/>
        </>
      ) : (
        <div className="emptySmall">Aucun client selectionne.</div>
      )}
    </section>
  );
}
