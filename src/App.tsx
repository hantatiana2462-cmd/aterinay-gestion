import logo from "./assets/logo.png";
import { supabase } from "./lib/supabase";
import { ClientAdjustment } from "./types";
import { useEffect, useMemo, useState, useCallback } from "react";
import "./styles.css";
import ClientReceiptView from "./components/ClientReceiptView";
import {
  AppView,
  Delivery,
  Rider,
  MoneyEntry,
  PartnerPurchaseEntry,
  RiderPayroll,
  SalaryAdvance,
  DeliveryStatus,
  PaymentMode,
  ClientType,
} from "./types";
import {
  APP_PIN,
  STORAGE_KEYS,
  PARTNER_CLIENTS,
  INITIAL_RIDERS,
  initialPayroll,
} from "./constants";
import {
  formatAr,
  statusLabel,
  statusClass,
  isPartnerClient,
  getClientReceipt,
  getRiderVersement,
  getOutstandingVersement,
  getRetourCount,
  isSameMonth,
} from "./helpers";
import { usePersist, useLoadPersist } from "./hooks/usePersist";
import DeliveryTable from "./components/DeliveryTable";
import SalairesView from "./components/SalairesView";
import FinanceView from "./components/FinanceView";
import LivreursView from "./components/LivreursView";
import { ClientsView, ClientDetails } from "./components/ClientsView";
import LivreurDetails from "./components/LivreurDetails";
import AterinayView from "./components/AterinayView";
import PartnerView from "./components/PartnerView";
import {
  useSearchDeliveries,
  useDeliveriesByDate,
  useDeliveriesByMonth,
} from "./hooks/useFilters";
import {
  usePayrollStats,
  useRiderStats,
  useClientStats,
} from "./hooks/usePayroll";

const today = new Date().toISOString().split("T")[0];

// Données de test par défaut
const DEFAULT_DELIVERIES: Delivery[] = [
  {
    id: 1,
    date: today,
    rider: "mamy",
    client: "client a",
    clientType: "normal",
    lieu: "Analakely",
    description: "Commande remise au client",
    prix: 25000,
    frais: 5000,
    status: "faite",
    raison: "",
    retours: 0,
    colisPayment: "nous",
    fraisPayment: "nous",
    paymentStatus: "non_recu",
  },
  {
    id: 2,
    date: today,
    rider: "mario",
    client: "pomanai",
    clientType: "entreprise",
    lieu: "Ivandry",
    description: "Livraison partenaire",
    prix: 18000,
    frais: 4000,
    status: "faite",
    raison: "",
    retours: 0,
    colisPayment: "mobile_money_nous",
    fraisPayment: "mobile_money_nous",
    paymentStatus: "non_recu",
  },
  {
    id: 3,
    date: today,
    rider: "tahiana",
    client: "zazatiana",
    clientType: "entreprise",
    lieu: "67Ha",
    description: "Client indisponible",
    prix: 32000,
    frais: 6000,
    status: "non_faite",
    raison: "annulé",
    retours: 1,
    colisPayment: "direct_client",
    fraisPayment: "direct_client",
    paymentStatus: "non_recu",
  },
];

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [view, setView] = useState<AppView>("livreurs");
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchText, setSearchText] = useState("");

  const [selectedRiderDetails, setSelectedRiderDetails] = useState<
    string | null
  >(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<
    string | null
  >(null);

  const [openDeliveryId, setOpenDeliveryId] = useState<number | null>(null);
  const [openPartner, setOpenPartner] = useState<
    "pomanai" | "zazatiana" | null
  >(null);
  const [openSalaryRider, setOpenSalaryRider] = useState<string | null>(null);

  const [openAddDelivery, setOpenAddDelivery] = useState(true);
  const [openRiderManagement, setOpenRiderManagement] = useState(false);
  const [openGlobalDetails, setOpenGlobalDetails] = useState(false);
  const [openRiderList, setOpenRiderList] = useState(true);
  const [openClientList, setOpenClientList] = useState(true);

  const [riders, setRiders] = useState<Rider[]>(() =>
    useLoadPersist(STORAGE_KEYS.RIDERS, INITIAL_RIDERS)
  );

  const [deliveries, setDeliveries] = useState<Delivery[]>(() =>
    useLoadPersist(STORAGE_KEYS.DELIVERIES, DEFAULT_DELIVERIES)
  );

  const [otherGains, setOtherGains] = useState<MoneyEntry[]>(() =>
    useLoadPersist(STORAGE_KEYS.OTHER_GAINS, [])
  );

  const [otherExpenses, setOtherExpenses] = useState<MoneyEntry[]>(() =>
    useLoadPersist(STORAGE_KEYS.OTHER_EXPENSES, [])
  );

  const [clientAdjustments, setClientAdjustments] = useState<ClientAdjustment[]>(() =>
  useLoadPersist(STORAGE_KEYS.CLIENT_ADJUSTMENTS, [])
);
  
  const [pomanaiPurchases, setPomanaiPurchases] = useState<
    PartnerPurchaseEntry[]
  >(() => useLoadPersist(STORAGE_KEYS.POMANAI_PURCHASES, []));

  const [zazatianaPurchases, setZazatianaPurchases] = useState<
    PartnerPurchaseEntry[]
  >(() => useLoadPersist(STORAGE_KEYS.ZAZATIANA_PURCHASES, []));

  const [riderPayroll, setRiderPayroll] = useState<RiderPayroll[]>(() =>
    useLoadPersist(STORAGE_KEYS.RIDER_PAYROLL, initialPayroll(INITIAL_RIDERS))
  );

  const [gainForm, setGainForm] = useState({ label: "", amount: "" });
  const [expenseForm, setExpenseForm] = useState({ label: "", amount: "" });

  const [form, setForm] = useState({
    date: today,
    rider: "mamy",
    client: "",
    contact: "",
    clientType: "normal" as ClientType,
    lieu: "",
    description: "",
    prix: "",
    frais: "",
    status: "en_cours" as DeliveryStatus,
    raison: "",
    retours: "0",
    colisPayment: "nous" as PaymentMode,
    fraisPayment: "nous" as PaymentMode,
  });

  const [newRiderName, setNewRiderName] = useState("");
  const [confirmRiderId, setConfirmRiderId] = useState<number | null>(null);

  const [pomanaiForm, setPomanaiForm] = useState({
    date: today,
    amount: "",
    description: "",
  });

  const [zazatianaForm, setZazatianaForm] = useState({
    date: today,
    amount: "",
    description: "",
  });

  const [advanceForms, setAdvanceForms] = useState<
    Record<string, { label: string; amount: string }>
  >({});
  const [baseSalaryInputs, setBaseSalaryInputs] = useState<
    Record<string, string>
  >({});

  // Persistence avec debouncing
  usePersist(deliveries, STORAGE_KEYS.DELIVERIES);
  usePersist(riders, STORAGE_KEYS.RIDERS);
  usePersist(otherGains, STORAGE_KEYS.OTHER_GAINS);
  usePersist(otherExpenses, STORAGE_KEYS.OTHER_EXPENSES);
  usePersist(pomanaiPurchases, STORAGE_KEYS.POMANAI_PURCHASES);
  usePersist(zazatianaPurchases, STORAGE_KEYS.ZAZATIANA_PURCHASES);
  usePersist(riderPayroll, STORAGE_KEYS.RIDER_PAYROLL);
  usePersist(clientAdjustments, STORAGE_KEYS.CLIENT_ADJUSTMENTS);

  // Sync payroll avec riders
  useEffect(() => {
    setRiderPayroll((prev) => {
      const existing = new Map(prev.map((p) => [p.rider, p]));
      return riders.map(
        (r) =>
          existing.get(r.name) ?? {
            rider: r.name,
            baseSalary: 0,
            recoveries: 0,
            advances: [],
          }
      );
    });
  }, [riders]);

  useEffect(() => {
  const loadDeliveriesFromSupabase = async () => {
    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("SUPABASE LOAD ERROR:", error);
      return;
    }

    if (data) {
      setDeliveries(data as Delivery[]);
    }
  };

  // Chargement initial
  loadDeliveriesFromSupabase();

  // 🔥 Realtime
  const channel = supabase
    .channel("realtime deliveries")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "deliveries",
      },
      () => {
        loadDeliveriesFromSupabase();
      }
    )
    .subscribe();

  // Cleanup
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);



  // Hooks de filtrage
  const activeRiders = useMemo(() => riders.filter((r) => r.active), [riders]);
  const deliveriesForDate = useDeliveriesByDate(deliveries, selectedDate);
  const deliveriesForMonth = useDeliveriesByMonth(deliveries, selectedDate);
  const searchedDeliveries = useSearchDeliveries(deliveriesForDate, searchText);

  // Hooks de statistiques
  const riderStats = useRiderStats(riders, searchedDeliveries);
  const clientStats = useClientStats(searchedDeliveries);
  const payrollStats = usePayrollStats(riderPayroll);

  const selectedRiderGroup = useMemo(
    () => riderStats.find((r) => r.rider === selectedRiderDetails) ?? null,
    [riderStats, selectedRiderDetails]
  );

  const selectedClientGroup = useMemo(
    () => clientStats.find((c) => c.client === selectedClientDetails) ?? null,
    [clientStats, selectedClientDetails]
  );

  const totalRecusClients = useMemo(
    () => clientStats.reduce((sum, c) => sum + c.totalReceipts, 0),
    [clientStats]
  );

  const globalStats = useMemo(() => {
    const faites = searchedDeliveries.filter((d) => d.status === "faite");
    const totalPrixColis = faites.reduce((sum, d) => sum + d.prix, 0);
    const totalPrixLivraison = faites.reduce((sum, d) => sum + d.frais, 0);

    return {
      livraisonsFaites: faites.length,
      totalPrixColis,
      totalPrixLivraison,
      totalGeneral: totalPrixColis + totalPrixLivraison,
    };
  }, [searchedDeliveries]);

  const financeStats = useMemo(() => {
    const faites = deliveriesForDate.filter((d) => d.status === "faite");

    const normalDone = faites.filter((d) => !isPartnerClient(d.client));
    const pomanaiDone = faites.filter((d) => d.client === "pomanai");
    const zazatianaDone = faites.filter((d) => d.client === "zazatiana");

    const autoPrixColis = normalDone.reduce(
      (sum, d) => sum + (d.colisPayment === "direct_client" ? 0 : d.prix),
      0
    );

    const autoFraisLivraison = normalDone.reduce((sum, d) => sum + d.frais, 0);

    const pomanaiPrixColis = pomanaiDone.reduce((sum, d) => sum + d.prix, 0);
    const zazatianaPrixColis = zazatianaDone.reduce((sum, d) => sum + d.prix, 0);

    const totalRecusClientsFinance = normalDone.reduce(
  (sum, d) =>
    sum +
    (d.colisPayment === "nous" ||
    d.colisPayment === "mobile_money_nous"
      ? d.prix
      : 0),
  0
);

    const manualGains = otherGains.reduce((sum, g) => sum + g.amount, 0);
    const manualExpenses = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalGains =
      autoPrixColis +
      autoFraisLivraison +
      pomanaiPrixColis +
      zazatianaPrixColis +
      manualGains;

    const totalExpenses = totalRecusClientsFinance + manualExpenses;
    const balance = totalGains - totalExpenses;

    return {
      autoPrixColis,
      autoFraisLivraison,
      pomanaiPrixColis,
      zazatianaPrixColis,
      totalRecusClientsFinance,
      manualGains,
      manualExpenses,
      totalGains,
      totalExpenses,
      balance,
    };
  }, [deliveriesForDate, otherGains, otherExpenses]);

  const buildPartnerStats = useCallback(
    (partnerName: string, purchases: PartnerPurchaseEntry[]) => {
      const dailyRows = deliveriesForDate.filter(
        (d) => d.client === partnerName && d.status === "faite"
      );
      const monthlyRows = deliveriesForMonth.filter(
        (d) => d.client === partnerName && d.status === "faite"
      );

      const dailyColis = dailyRows.reduce((sum, d) => sum + d.prix, 0);
      const monthlyColis = monthlyRows.reduce((sum, d) => sum + d.prix, 0);

      const dailyPurchases = purchases
        .filter((p) => p.date === selectedDate)
        .reduce((sum, p) => sum + p.amount, 0);

      const monthlyPurchases = purchases
        .filter((p) => isSameMonth(p.date, selectedDate))
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        dailyRows,
        monthlyRows,
        dailyColis,
        monthlyColis,
        dailyPurchases,
        monthlyPurchases,
        dailyProfit: dailyColis - dailyPurchases,
        monthlyProfit: monthlyColis - monthlyPurchases,
      };
    },
    [deliveriesForDate, deliveriesForMonth, selectedDate]
  );

  const pomanaiStats = useMemo(
    () => buildPartnerStats("pomanai", pomanaiPurchases),
    [buildPartnerStats, pomanaiPurchases]
  );

  const zazatianaStats = useMemo(
    () => buildPartnerStats("zazatiana", zazatianaPurchases),
    [buildPartnerStats, zazatianaPurchases]
  );

  const totalSalaries = useMemo(
    () => payrollStats.reduce((sum, p) => sum + p.totalSalary, 0),
    [payrollStats]
  );

  const aterinayStats = useMemo(() => {
    const faites = deliveriesForDate.filter((d) => d.status === "faite");
    const totalFrais = faites.reduce((sum, d) => sum + d.frais, 0);
    const totalDeliveries = faites.length;
    const logistics = totalDeliveries * 500;
    const result = totalFrais - totalSalaries - logistics;

    return {
      totalFrais,
      totalDeliveries,
      logistics,
      totalSalaries,
      result,
    };
  }, [deliveriesForDate, totalSalaries]);

  const unlockApp = useCallback(() => {
    if (pinInput === APP_PIN) {
      setIsUnlocked(true);
      setPinError("");
      return;
    }
    setPinError("Code incorrect");
  }, [pinInput]);

  const addDelivery = useCallback(async() => {
    if (!form.client.trim() || !form.lieu.trim() || !form.prix || !form.frais) {
      return;
    }
    if (form.contact.trim() && !form.contact.trim().startsWith("03")) {
  return;
}

    const cleanedClient = form.client.trim().toLowerCase();
    const inferredClientType = isPartnerClient(cleanedClient)
      ? "entreprise"
      : form.clientType;

    const newDelivery: Delivery = {
      id: Date.now(),
      date: form.date,
      rider: form.rider,
      client: cleanedClient,
      contact: form.contact.trim(),
      clientType: inferredClientType,
      lieu: form.lieu.trim(),
      description: form.description.trim(),
      prix: Number(form.prix),
      frais: Number(form.frais),
      status: form.status,
      raison: form.status === "non_faite" ? form.raison.trim() : "",
      retours:
        form.status === "non_faite"
          ? 1
          : form.status === "faite"
            ? Number(form.retours || 0)
            : 0,
      colisPayment: form.colisPayment,
      fraisPayment: form.fraisPayment,
      paymentStatus: "non_recu",
    };
    const { id, ...deliveryToInsert } = newDelivery;

const { data, error } = await supabase
  .from("deliveries")
  .insert([deliveryToInsert])
  .select()
  .single();

if (error) {
  console.log("SUPABASE INSERT ERROR:", error);
  alert("Erreur Supabase : la livraison n'a pas ete enregistree.");
  return;
}

setDeliveries((prev) => [data as Delivery, ...prev]);



    setForm((prev) => ({
      ...prev,
      contact: "",
      lieu: "",
      description: "",
      prix: "",
      frais: "",
      status: "en_cours",
      raison: "",
      retours: "0",
      colisPayment: "nous",
      fraisPayment: "nous",
    }));
  }, [form]);

  const updateDeliveryField = useCallback(
    (id: number, field: keyof Delivery, value: string | number) => {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          const updated = { ...d, [field]: value } as Delivery;

          if (field === "client") {
            updated.client = String(value).trim().toLowerCase();
            updated.clientType = isPartnerClient(updated.client)
              ? "entreprise"
              : updated.clientType;
          }

          if (field === "clientType") {
            updated.clientType = value as ClientType;
          }

          if (field === "status") {
            if (value !== "non_faite") updated.raison = "";
            if (value === "non_faite") updated.retours = 1;
            if (value === "en_cours") updated.retours = 0;
          }

          return updated;
        })
      );
    },
    []
  );

  const togglePaymentReceived = useCallback((id: number) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              paymentStatus: d.paymentStatus === "recu" ? "non_recu" : "recu",
            }
          : d
      )
    );
  }, []);

  const markAllRiderPaymentsReceived = useCallback((riderName: string) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.date !== selectedDate) return d;
        if (d.rider !== riderName) return d;
        if (getRiderVersement(d) <= 0) return d;
        return { ...d, paymentStatus: "recu" };
      })
    );
  }, [selectedDate]);

  const deleteDelivery = useCallback((id: number) => {
    setDeliveries((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addRider = useCallback(() => {
    const cleaned = newRiderName.trim().toLowerCase();
    if (!cleaned) return;
    if (riders.some((r) => r.name.toLowerCase() === cleaned)) return;

    const created: Rider = {
      id: Date.now(),
      name: cleaned,
      active: true,
    };

    setRiders((prev) => [...prev, created]);
    setNewRiderName("");
  }, [newRiderName, riders]);

  const updateRiderName = useCallback(
    (id: number, value: string) => {
      const cleaned = value.trim().toLowerCase();
      const oldRider = riders.find((r) => r.id === id);
      if (!oldRider || !cleaned) return;

      const exists = riders.some(
        (r) => r.id !== id && r.name.toLowerCase() === cleaned
      );
      if (exists) return;

      const oldName = oldRider.name;

      setRiders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, name: cleaned } : r))
      );

      setDeliveries((prev) =>
        prev.map((d) => (d.rider === oldName ? { ...d, rider: cleaned } : d))
      );

      setRiderPayroll((prev) =>
        prev.map((p) => (p.rider === oldName ? { ...p, rider: cleaned } : p))
      );

      if (form.rider === oldName) {
        setForm((prev) => ({ ...prev, rider: cleaned }));
      }

      if (selectedRiderDetails === oldName) {
        setSelectedRiderDetails(cleaned);
      }
    },
    [riders, form.rider, selectedRiderDetails]
  );

  const confirmToggleRider = useCallback(() => {
    if (confirmRiderId === null) return;

    const rider = riders.find((r) => r.id === confirmRiderId);
    if (!rider) return;

    setRiders((prev) =>
      prev.map((r) =>
        r.id === confirmRiderId ? { ...r, active: !r.active } : r
      )
    );

    if (rider.active && form.rider === rider.name) {
      const fallback = activeRiders.find((r) => r.id !== rider.id);
      if (fallback) {
        setForm((prev) => ({ ...prev, rider: fallback.name }));
      }
    }

    setConfirmRiderId(null);
  }, [confirmRiderId, riders, form.rider, activeRiders]);

  const addOtherGain = useCallback(() => {
    if (!gainForm.label.trim() || !gainForm.amount) return;
    setOtherGains((prev) => [
      {
        id: Date.now(),
        label: gainForm.label.trim(),
        amount: Number(gainForm.amount),
      },
      ...prev,
    ]);
    setGainForm({ label: "", amount: "" });
  }, [gainForm]);

  const addOtherExpense = useCallback(() => {
    if (!expenseForm.label.trim() || !expenseForm.amount) return;
    setOtherExpenses((prev) => [
      {
        id: Date.now(),
        label: expenseForm.label.trim(),
        amount: Number(expenseForm.amount),
      },
      ...prev,
    ]);
    setExpenseForm({ label: "", amount: "" });
  }, [expenseForm]);

  const deleteOtherGain = useCallback((id: number) => {
    setOtherGains((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const deleteOtherExpense = useCallback((id: number) => {
    setOtherExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addPartnerPurchase = useCallback(
    (
      partner: "pomanai" | "zazatiana",
      amount: string,
      date: string,
      description: string
    ) => {
      if (!amount) return;

      const entry: PartnerPurchaseEntry = {
        id: Date.now(),
        date,
        amount: Number(amount),
        description: description.trim(),
      };

      if (partner === "pomanai") {
        setPomanaiPurchases((prev) => [entry, ...prev]);
      } else {
        setZazatianaPurchases((prev) => [entry, ...prev]);
      }
    },
    []
  );

  const deletePartnerPurchase = useCallback(
    (partner: "pomanai" | "zazatiana", id: number) => {
      if (partner === "pomanai") {
        setPomanaiPurchases((prev) => prev.filter((p) => p.id !== id));
      } else {
        setZazatianaPurchases((prev) => prev.filter((p) => p.id !== id));
      }
    },
    []
  );

  const updateBaseSalary = useCallback((riderName: string, amount: number) => {
    setRiderPayroll((prev) =>
      prev.map((p) =>
        p.rider === riderName ? { ...p, baseSalary: amount } : p
      )
    );
  }, []);

  const addRecovery = useCallback((riderName: string) => {
    setRiderPayroll((prev) =>
      prev.map((p) =>
        p.rider === riderName ? { ...p, recoveries: p.recoveries + 1 } : p
      )
    );
  }, []);

  const removeRecovery = useCallback((riderName: string) => {
    setRiderPayroll((prev) =>
      prev.map((p) =>
        p.rider === riderName
          ? { ...p, recoveries: Math.max(0, p.recoveries - 1) }
          : p
      )
    );
  }, []);

  const addAdvance = useCallback((riderName: string) => {
    const formData = advanceForms[riderName] || { label: "", amount: "" };
    if (!formData.label.trim() || !formData.amount) return;

    const advance: SalaryAdvance = {
      id: Date.now(),
      label: formData.label.trim(),
      amount: Number(formData.amount),
    };

    setRiderPayroll((prev) =>
      prev.map((p) =>
        p.rider === riderName
          ? { ...p, advances: [advance, ...p.advances] }
          : p
      )
    );

    setAdvanceForms((prev) => ({
      ...prev,
      [riderName]: { label: "", amount: "" },
    }));
  }, [advanceForms]);

  const deleteAdvance = useCallback((riderName: string, advanceId: number) => {
    setRiderPayroll((prev) =>
      prev.map((p) =>
        p.rider === riderName
          ? { ...p, advances: p.advances.filter((a) => a.id !== advanceId) }
          : p
      )
    );
  }, []);

  if (!isUnlocked) {
    return (
      <div className="lockPage">
        <div className="lockCard">
          <div className="badge darkBadge">Accès sécurisé</div>
          <h1>Aterinay</h1>
          <p>Entre le code pour accéder à l'application.</p>

          <input
            type="password"
            placeholder="Entrer le code"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") unlockApp();
            }}
          />

          {pinError && <div className="pinError">{pinError}</div>}

          <button className="primaryBtn" onClick={unlockApp}>
            Ouvrir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero ultraCompactHero compactHeaderShell">
        <div className="heroTopLine compactHeaderTop">
          <div className="heroTitleMini">
  <div className="badge miniBadge">Aterinay</div>
  <div className="logoBlock">
    <img src={logo} alt="Logo Aterinay" className="appLogo" />
    <h1 className="appTitle">Aterinay</h1>
  </div>
</div>

          <div className="heroRightMini compactHeaderActions">
            <div className="dateMiniBox">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setForm((prev) => ({ ...prev, date: e.target.value }));
                  setPomanaiForm((prev) => ({ ...prev, date: e.target.value }));
                  setZazatianaForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }));
                }}
              />
            </div>

            <button
              className="secondaryBtn logoutBtn smallLogoutBtn"
              onClick={() => setIsUnlocked(false)}
            >
              Verrouiller
            </button>
          </div>
        </div>

        <div className="compactHeaderControls">
          <div className="compactHeaderField compactHeaderSelect">
            <label>Interface</label>
            <select
              value={
                view === "livreur_details"
                  ? "livreurs"
                  : view === "client_details"
                    ? "clients"
                    : view
              }
              onChange={(e) => {
                const nextView = e.target.value as Exclude<
                  AppView,
                  "livreur_details" | "client_details"
                >;
                setView(nextView);
                setOpenDeliveryId(null);
                setOpenPartner(null);
                setOpenSalaryRider(null);
              }}
              className="pageSelect"
            >
              <option value="livreurs">Livreurs</option>
              <option value="clients">Clients</option>
              <option value="finance">Finance</option>
              <option value="pomanai">POMANAI</option>
              <option value="zazatiana">ZAZATIANA</option>
              <option value="salaires">Salaires</option>
              <option value="aterinay">ATERINAY</option>
            </select>
          </div>

          <div className="compactHeaderField compactHeaderSearch">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="Chercher livreur, client, lieu, description..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </header>

      {view === "livreurs" && (
        <LivreursView
          riders={riders}
          activeRiders={activeRiders}
          riderStats={riderStats}
          globalStats={globalStats}
          deliveries={searchedDeliveries}
          form={form}
          newRiderName={newRiderName}
          openAddDelivery={openAddDelivery}
          openRiderList={openRiderList}
          openGlobalDetails={openGlobalDetails}
          openRiderManagement={openRiderManagement}
          onFormChange={setForm}
          onAddDelivery={addDelivery}
          onAddRider={addRider}
          onUpdateRiderName={updateRiderName}
          onToggleRiderActive={setConfirmRiderId}
          onMarkAllReceived={markAllRiderPaymentsReceived}
          onNewRiderNameChange={setNewRiderName}
          onSelectRider={(rider) => {
            setSelectedRiderDetails(rider);
            setOpenDeliveryId(null);
            setView("livreur_details");
          }}
          onToggleAddDelivery={() => setOpenAddDelivery(!openAddDelivery)}
          onToggleRiderList={() => setOpenRiderList(!openRiderList)}
          onToggleGlobalDetails={() => setOpenGlobalDetails(!openGlobalDetails)}
          onToggleRiderManagement={() => setOpenRiderManagement(!openRiderManagement)}
        />
      )}

      {view === "livreur_details" && (
        <LivreurDetails
          selectedRiderGroup={selectedRiderGroup}
          openDeliveryId={openDeliveryId}
          onBack={() => {
            setView("livreurs");
            setOpenDeliveryId(null);
          }}
          onToggleOpen={(id) =>
            setOpenDeliveryId(openDeliveryId === id ? null : id)
          }
          onUpdateField={updateDeliveryField}
          onTogglePayment={togglePaymentReceived}
          onDelete={deleteDelivery}
        />
      )}

      {view === "clients" && (
        <ClientsView
          clientStats={clientStats}
          totalRecusClients={totalRecusClients}
          openClientList={openClientList}
          onToggleList={() => setOpenClientList(!openClientList)}
          onSelectClient={(client) => {
            setSelectedClientDetails(client);
            setOpenDeliveryId(null);
            setView("client_details");
          }}
        />
      )}


      {view === "client_details" && (
        <ClientDetails
          selectedClientGroup={selectedClientGroup}
          clientAdjustments={clientAdjustments.filter(
  (a) => a.client === selectedClientDetails
)}
          setClientAdjustments={setClientAdjustments}
          openDeliveryId={openDeliveryId}
          onBack={() => {
            setView("clients");
            setOpenDeliveryId(null);
          }}
          onToggleOpen={(id) =>
            setOpenDeliveryId(openDeliveryId === id ? null : id)
          }
          onUpdateField={updateDeliveryField}
          onTogglePayment={togglePaymentReceived}
          onDelete={deleteDelivery}
        />
      )}

      {view === "finance" && (
        <FinanceView
          financeStats={financeStats}
          otherGains={otherGains}
          otherExpenses={otherExpenses}
          gainForm={gainForm}
          expenseForm={expenseForm}
          onGainFormChange={setGainForm}
          onExpenseFormChange={setExpenseForm}
          onAddGain={addOtherGain}
          onDeleteGain={deleteOtherGain}
          onAddExpense={addOtherExpense}
          onDeleteExpense={deleteOtherExpense}
        />
      )}

      {view === "pomanai" && (
        <PartnerView
          partnerKey="pomanai"
          title="POMANAI"
          stats={pomanaiStats}
          purchases={pomanaiPurchases}
          formState={pomanaiForm}
          selectedDate={selectedDate}
          isOpen={openPartner === "pomanai"}
          onToggleOpen={() =>
            setOpenPartner(openPartner === "pomanai" ? null : "pomanai")
          }
          onFormChange={setPomanaiForm}
          onAddPurchase={() => {
            addPartnerPurchase("pomanai", pomanaiForm.amount, pomanaiForm.date, pomanaiForm.description);
            setPomanaiForm({ date: selectedDate, amount: "", description: "" });
          }}
        />
      )}

      {view === "zazatiana" && (
        <PartnerView
          partnerKey="zazatiana"
          title="ZAZATIANA"
          stats={zazatianaStats}
          purchases={zazatianaPurchases}
          formState={zazatianaForm}
          selectedDate={selectedDate}
          isOpen={openPartner === "zazatiana"}
          onToggleOpen={() =>
            setOpenPartner(openPartner === "zazatiana" ? null : "zazatiana")
          }
          onFormChange={setZazatianaForm}
          onAddPurchase={() => {
            addPartnerPurchase("zazatiana", zazatianaForm.amount, zazatianaForm.date, zazatianaForm.description);
            setZazatianaForm({ date: selectedDate, amount: "", description: "" });
          }}
        />
      )}

      {view === "salaires" && (
        <SalairesView
          payrollStats={payrollStats}
          totalSalaries={totalSalaries}
          openSalaryRider={openSalaryRider}
          advanceForms={advanceForms}
          baseSalaryInputs={baseSalaryInputs}
          onToggleRider={(rider) =>
            setOpenSalaryRider(openSalaryRider === rider ? null : rider)
          }
          onBaseSalaryChange={(rider, value) =>
            setBaseSalaryInputs((prev) => ({ ...prev, [rider]: value }))
          }
          onUpdateBaseSalary={updateBaseSalary}
          onAddRecovery={addRecovery}
          onRemoveRecovery={removeRecovery}
          onAdvanceFormChange={(rider, field, value) =>
            setAdvanceForms((prev) => ({
              ...prev,
              [rider]: { ...(prev[rider] || { label: "", amount: "" }), [field]: value },
            }))
          }
          onAddAdvance={addAdvance}
          onDeleteAdvance={deleteAdvance}
        />
      )}

      {view === "aterinay" && (
        <AterinayView aterinayStats={aterinayStats} />
      )}

      {confirmRiderId !== null && (
        <div className="modalOverlay">
          <div className="modalBox">
            <h3>Confirmer</h3>
            <p>
              Le livreur changera de statut actif/inactif.
            </p>
            <div className="modalActions">
  <button
    className="secondaryBtn"
    onClick={() => setConfirmRiderId(null)}
  >
    Annuler
  </button>

  <button
    className="primaryBtn"
    onClick={confirmToggleRider}
  >
    Confirmer
  </button>
</div>
          </div>
        </div>
      )}
    </div>
  );
}

