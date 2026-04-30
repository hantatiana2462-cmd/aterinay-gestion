import { Fragment, useState } from "react";
import { Delivery, PaymentMode, Rider } from "../types";
import { formatAr, statusClass, statusLabel } from "../helpers";

type Props = {
  rows: Delivery[];
  riders: Rider[];
  openDeliveryId: number | null;
  showClient?: boolean;
  onToggleOpen: (id: number) => void;
  onUpdateField: (
    id: number,
    field: keyof Delivery,
    value: string | number
  ) => void;
  onTogglePayment: (id: number) => void;
  onDelete: (id: number) => void;
};

type PaymentField = "colisPayment" | "fraisPayment";

const statusEmoji = (status: Delivery["status"]) => {
  if (status === "faite") return "✅";
  if (status === "non_faite") return "❌";
  return "⏳";
};

export default function DeliveryTable({
  rows,
  riders,
  openDeliveryId,
  showClient = false,
  onToggleOpen,
  onUpdateField,
  onTogglePayment,
  onDelete,
}: Props) {
  const [compactMode, setCompactMode] = useState(true);

  if (rows.length === 0) {
    return <div className="emptySmall">Aucune livraison.</div>;
  }

  const renderStatusButtons = (row: Delivery) => (
    <div className="statusButtons">
      <button
        type="button"
        title="Faite"
        className={`statusPillBtn ${row.status === "faite" ? "statusDone" : ""}`}
        onClick={() => onUpdateField(row.id, "status", "faite")}
      >
        ✅
      </button>
      <button
        type="button"
        title="Non faite"
        className={`statusPillBtn ${
          row.status === "non_faite" ? "statusCancelled" : ""
        }`}
        onClick={() => onUpdateField(row.id, "status", "non_faite")}
      >
        ❌
      </button>
      <button
        type="button"
        title="En cours"
        className={`statusPillBtn ${
          row.status === "en_cours" ? "statusPending" : ""
        }`}
        onClick={() => onUpdateField(row.id, "status", "en_cours")}
      >
        ⏳
      </button>
    </div>
  );

  const renderPaymentButtons = (row: Delivery, field: PaymentField) => {
    const value = row[field] as PaymentMode;

    return (
      <div className="payButtons">
        <button
          type="button"
          className={`payBtn ${value === "nous" ? "activeNous" : ""}`}
          onClick={() => onUpdateField(row.id, field, "nous")}
        >
          Nous
        </button>
        <button
          type="button"
          className={`payBtn ${
            value === "direct_client" ? "activeClient" : ""
          }`}
          onClick={() => onUpdateField(row.id, field, "direct_client")}
        >
          Client
        </button>
        <button
          type="button"
          className={`payBtn ${
            value === "mobile_money_nous" ? "activeMobile" : ""
          }`}
          onClick={() => onUpdateField(row.id, field, "mobile_money_nous")}
        >
          Mvola
        </button>
      </div>
    );
  };

  const renderEditPanel = (row: Delivery) => (
    <>
      <div className="deliveryEditGrid">
        <div className="fieldBlock">
          <label>Client</label>
          <input
            value={row.client}
            onChange={(e) => onUpdateField(row.id, "client", e.target.value)}
          />
        </div>

        <div className="fieldBlock">
          <label>Livreur</label>
          <select
            value={row.rider}
            onChange={(e) => onUpdateField(row.id, "rider", e.target.value)}
          >
            {riders.map((rider) => (
              <option key={rider.id} value={rider.name}>
                {rider.name}
              </option>
            ))}
          </select>
        </div>

        <div className="fieldBlock">
          <label>Lieu</label>
          <input
            value={row.lieu}
            onChange={(e) => onUpdateField(row.id, "lieu", e.target.value)}
          />
        </div>

        <div className="fieldBlock">
          <label>Description</label>
          <input
            value={row.description}
            onChange={(e) =>
              onUpdateField(row.id, "description", e.target.value)
            }
          />
        </div>

        {row.status === "non_faite" && (
          <div className="fieldBlock">
            <label>Raison</label>
            <input
              value={row.raison}
              onChange={(e) => onUpdateField(row.id, "raison", e.target.value)}
            />
          </div>
        )}

        <div className="fieldBlock">
          <label>Prix colis</label>
          <input
            type="number"
            value={row.prix}
            onChange={(e) =>
              onUpdateField(row.id, "prix", Number(e.target.value))
            }
          />
        </div>

        <div className="fieldBlock">
          <label>Frais livraison</label>
          <input
            type="number"
            value={row.frais}
            onChange={(e) =>
              onUpdateField(row.id, "frais", Number(e.target.value))
            }
          />
        </div>

        <div className="fieldBlock">
          <label>Retours</label>
          <input
            type="number"
            value={row.retours}
            onChange={(e) =>
              onUpdateField(row.id, "retours", Number(e.target.value))
            }
          />
        </div>
      </div>

      <div className="deliveryEditActions">
        <button className="dangerBtn" onClick={() => onDelete(row.id)}>
          Supprimer
        </button>
      </div>
    </>
  );

  return (
    <div className="deliveryTableSection">
      <div className="deliveryTableToolbar">
        <button
          type="button"
          className="secondaryBtn tableSizeToggle"
          onClick={() => setCompactMode((prev) => !prev)}
        >
          {compactMode ? "Agrandir le tableau" : "Reduire le tableau"}
        </button>
      </div>

      <div className="deliveryMobileCards">
        {rows.map((row) => {
          const isOpen = openDeliveryId === row.id;

          return (
            <article
              className={`deliveryMobileCard deliveryStatus-${row.status}`}
              key={row.id}
            >
              <div className="deliveryMobileTop">
                <div>
                  <strong>{row.lieu}</strong>
                  {showClient && <span>Client: {row.client}</span>}
                </div>
                <span
                  title={statusLabel(row.status)}
                  className={`statusBadge ${statusClass(row.status)}`}
                >
                  {statusEmoji(row.status)}
                </span>
              </div>

              {(row.description || row.raison) && (
                <div className="deliveryMobileNote">
                  {row.status === "non_faite" && row.raison
                    ? `Raison: ${row.raison}`
                    : row.description}
                </div>
              )}

              <div className="deliveryMobileMoney">
                <div>
                  <span>Colis</span>
                  <strong>{formatAr(row.prix)}</strong>
                  {renderPaymentButtons(row, "colisPayment")}
                </div>
                <div>
                  <span>Frais</span>
                  <strong>{formatAr(row.frais)}</strong>
                  {renderPaymentButtons(row, "fraisPayment")}
                </div>
              </div>

              <div className="deliveryMobileActions">
                {renderStatusButtons(row)}
                <button
                  className={`miniPayBadge ${
                    row.paymentStatus === "recu" ? "payReceived" : "payPending"
                  }`}
                  onClick={() => onTogglePayment(row.id)}
                >
                  {row.paymentStatus === "recu" ? "Recu" : "Restant"}
                </button>
                <button
                  className="secondaryBtn"
                  onClick={() => onToggleOpen(row.id)}
                >
                  {isOpen ? "Fermer" : "Modifier"}
                </button>
              </div>

              {isOpen && (
                <div className="deliveryMobileEdit">{renderEditPanel(row)}</div>
              )}
            </article>
          );
        })}
      </div>

      <div
        className={`deliveryTableWrap desktopDeliveryTableWrap ${
          compactMode ? "tableCompact" : "tableWide"
        }`}
      >
        <table className="deliveryTable">
          <thead>
            <tr>
              <th>Lieu / Detail</th>
              <th>Statut</th>
              <th>Colis</th>
              <th>Frais</th>
              <th>Versement</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const isOpen = openDeliveryId === row.id;

              return (
                <Fragment key={row.id}>
                  <tr className={`deliveryMainRow deliveryStatus-${row.status}`}>
                    <td>
                      <div className="deliveryMainInfo">
                        <div className="deliveryPlace">{row.lieu}</div>

                        {showClient && (
                          <div className="deliveryDescription">
                            Client: {row.client}
                          </div>
                        )}

                        {row.description && (
                          <div className="deliveryDescription">
                            {row.description}
                          </div>
                        )}

                        {row.status === "non_faite" && row.raison && (
                          <div className="deliveryReason">
                            Raison: {row.raison}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      {renderStatusButtons(row)}
                      <div className="currentStatusLine">
                        <span
                          title={statusLabel(row.status)}
                          className={`statusBadge ${statusClass(row.status)}`}
                        >
                          {statusEmoji(row.status)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="priceCell">
                        <div className="priceValue">{formatAr(row.prix)}</div>
                        {renderPaymentButtons(row, "colisPayment")}
                      </div>
                    </td>

                    <td>
                      <div className="priceCell">
                        <div className="priceValue">{formatAr(row.frais)}</div>
                        {renderPaymentButtons(row, "fraisPayment")}
                      </div>
                    </td>

                    <td>
                      <button
                        className={`miniPayBadge ${
                          row.paymentStatus === "recu"
                            ? "payReceived"
                            : "payPending"
                        }`}
                        onClick={() => onTogglePayment(row.id)}
                      >
                        {row.paymentStatus === "recu" ? "Recu" : "Restant"}
                      </button>
                    </td>

                    <td>
                      <button
                        className="secondaryBtn"
                        onClick={() => onToggleOpen(row.id)}
                      >
                        {isOpen ? "Fermer" : "Modifier"}
                      </button>
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="deliveryEditRow">
                      <td colSpan={6}>{renderEditPanel(row)}</td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
