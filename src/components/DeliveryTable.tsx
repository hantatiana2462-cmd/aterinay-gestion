import { Fragment, useState } from "react";
import { Delivery } from "../types";
import { formatAr, statusClass, statusLabel } from "../helpers";

type Props = {
  rows: Delivery[];
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

const statusEmoji = (status: Delivery["status"]) => {
  if (status === "faite") return "✅";
  if (status === "non_faite") return "❌";
  return "⏳";
};

export default function DeliveryTable({
  rows,
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

  return (
    <div className="deliveryTableSection">
      <div className="deliveryTableToolbar">
        <button
          type="button"
          className="secondaryBtn tableSizeToggle"
          onClick={() => setCompactMode((prev) => !prev)}
        >
          {compactMode ? "Agrandir le tableau" : "Réduire le tableau"}
        </button>
      </div>

      <div
        className={`deliveryTableWrap ${
          compactMode ? "tableCompact" : "tableWide"
        }`}
      >
        <table className="deliveryTable">
          <thead>
            <tr>
              <th>Lieu / Détail</th>
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
                  <tr className="deliveryMainRow">
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
                      <div className="statusButtons">
                        <button
                          type="button"
                          title="Faite"
                          className={`statusPillBtn ${
                            row.status === "faite" ? "statusDone" : ""
                          }`}
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
                          onClick={() =>
                            onUpdateField(row.id, "status", "non_faite")
                          }
                        >
                          ❌
                        </button>

                        <button
                          type="button"
                          title="En cours"
                          className={`statusPillBtn ${
                            row.status === "en_cours" ? "statusPending" : ""
                          }`}
                          onClick={() =>
                            onUpdateField(row.id, "status", "en_cours")
                          }
                        >
                          ⏳
                        </button>
                      </div>

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

                        <div className="payButtons">
                          <button
                            type="button"
                            className={`payBtn ${
                              row.colisPayment === "nous" ? "activeNous" : ""
                            }`}
                            onClick={() =>
                              onUpdateField(row.id, "colisPayment", "nous")
                            }
                          >
                            Nous
                          </button>

                          <button
                            type="button"
                            className={`payBtn ${
                              row.colisPayment === "direct_client"
                                ? "activeClient"
                                : ""
                            }`}
                            onClick={() =>
                              onUpdateField(
                                row.id,
                                "colisPayment",
                                "direct_client"
                              )
                            }
                          >
                            Client
                          </button>

                          <button
                            type="button"
                            className={`payBtn ${
                              row.colisPayment === "mobile_money_nous"
                                ? "activeMobile"
                                : ""
                            }`}
                            onClick={() =>
                              onUpdateField(
                                row.id,
                                "colisPayment",
                                "mobile_money_nous"
                              )
                            }
                          >
                            Mvola
                          </button>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="priceCell">
                        <div className="priceValue">{formatAr(row.frais)}</div>

                        <div className="payButtons">
                          <button
                            type="button"
                            className={`payBtn ${
                              row.fraisPayment === "nous" ? "activeNous" : ""
                            }`}
                            onClick={() =>
                              onUpdateField(row.id, "fraisPayment", "nous")
                            }
                          >
                            Nous
                          </button>

                          <button
                            type="button"
                            className={`payBtn ${
                              row.fraisPayment === "direct_client"
                                ? "activeClient"
                                : ""
                            }`}
                            onClick={() =>
                              onUpdateField(
                                row.id,
                                "fraisPayment",
                                "direct_client"
                              )
                            }
                          >
                            Client
                          </button>

                          <button
                            type="button"
                            className={`payBtn ${
                              row.fraisPayment === "mobile_money_nous"
                                ? "activeMobile"
                                : ""
                            }`}
                            onClick={() =>
                              onUpdateField(
                                row.id,
                                "fraisPayment",
                                "mobile_money_nous"
                              )
                            }
                          >
                            Mvola
                          </button>
                        </div>
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
                        {row.paymentStatus === "recu" ? "Reçu" : "Restant"}
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
                      <td colSpan={6}>
                        <div className="deliveryEditGrid">
                          <div className="fieldBlock">
                            <label>Lieu</label>
                            <input
                              value={row.lieu}
                              onChange={(e) =>
                                onUpdateField(row.id, "lieu", e.target.value)
                              }
                            />
                          </div>

                          <div className="fieldBlock">
                            <label>Description</label>
                            <input
                              value={row.description}
                              onChange={(e) =>
                                onUpdateField(
                                  row.id,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          {row.status === "non_faite" && (
                            <div className="fieldBlock">
                              <label>Raison</label>
                              <input
                                value={row.raison}
                                onChange={(e) =>
                                  onUpdateField(row.id, "raison", e.target.value)
                                }
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
                                onUpdateField(
                                  row.id,
                                  "retours",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="deliveryEditActions">
                          <button
                            className="dangerBtn"
                            onClick={() => onDelete(row.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
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
