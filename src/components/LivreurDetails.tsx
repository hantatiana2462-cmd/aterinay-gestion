import { Delivery } from "../types";
import { formatAr, getRetourCount } from "../helpers";
import DeliveryTable from "./DeliveryTable";
import {
  generateRiderDeliveryListPdf,
  generateRiderDeliveryListTicketPdf,
} from "../utils/riderDeliveryListPdf";

type RiderGroup = {
  rider: string;
  rows: Delivery[];
  totalLivraisons: number;
  enCours: number;
  nonFaites: number;
  totalRestant: number;
};

type Props = {
  selectedRiderGroup: RiderGroup | null;
  openDeliveryId: number | null;
  onBack: () => void;
  onToggleOpen: (id: number) => void;
  onUpdateField: (id: number, field: keyof Delivery, value: string | number) => void;
  onTogglePayment: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function LivreurDetails({
  selectedRiderGroup,
  openDeliveryId,
  onBack,
  onToggleOpen,
  onUpdateField,
  onTogglePayment,
  onDelete,
}: Props) {
  const totalRetours = selectedRiderGroup
    ? selectedRiderGroup.rows.reduce((sum, row) => sum + getRetourCount(row), 0)
    : 0;

  return (
    <section className="panel compactDetailPage">
      <div className="panelHeaderRow">
  <h2>{selectedRiderGroup ? selectedRiderGroup.rider : "Livreur"}</h2>

  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
    {selectedRiderGroup && (
      <button
        className="primaryBtn"
        onClick={async () =>
          await generateRiderDeliveryListPdf({
            riderName: selectedRiderGroup.rider,
            deliveries: selectedRiderGroup.rows,
            selectedDate: new Date().toLocaleDateString("fr-FR"),
          })
        }
      >
        Télécharger liste PDF
      </button>
    )}
    <button
  className="secondaryBtn"
  type="button"
  onClick={() => {
    if (!selectedRiderGroup) return;

    generateRiderDeliveryListTicketPdf({
      riderName: selectedRiderGroup.rider,
      deliveries: selectedRiderGroup.rows,
    });
  }}
>
  Ticket 80mm
</button>

    <button className="secondaryBtn" onClick={onBack}>
      Retour
    </button>
  </div>
</div>

      {selectedRiderGroup ? (
        <>
          <div className="detailInlineStats">
            <span className="statItem statDone">
              Faites: <strong>{selectedRiderGroup.totalLivraisons}</strong>
            </span>

            <span className="separator">/</span>

            <span className="statItem statFailed">
              Non faites: <strong>{selectedRiderGroup.nonFaites}</strong>
            </span>

            <span className="separator">/</span>

            <span className="statItem statPending">
              En cours: <strong>{selectedRiderGroup.enCours}</strong>
            </span>

            <span className="separator">/</span>

            <span className="statItem statReturn">
              Retours: <strong>{totalRetours}</strong>
            </span>

            <span className="separator">/</span>

            <span className="statItem statMoney">
              Restant: <strong>{formatAr(selectedRiderGroup.totalRestant)}</strong>
            </span>
          </div>

          <DeliveryTable
            rows={selectedRiderGroup.rows}
            openDeliveryId={openDeliveryId}
            showClient={true}
            onToggleOpen={onToggleOpen}
            onUpdateField={onUpdateField}
            onTogglePayment={onTogglePayment}
            onDelete={onDelete}
          />
        </>
      ) : (
        <div className="emptySmall">Aucun livreur sélectionné.</div>
      )}
    </section>
  );
}

