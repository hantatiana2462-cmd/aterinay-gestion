import logo from "./assets/logo.png";
import { supabase } from "./lib/supabase";
import { ClientAdjustment } from "./types";
import { useEffect, useMemo, useState, useCallback } from "react";
import "./styles.css";
import ClientReceiptView from "./components/ClientReceiptView";
import Tesseract from "tesseract.js";
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
  normalizeAriaryInput,
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

type BrowserSpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type BrowserSpeechRecognitionErrorEvent = {
  error?: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

type MainAppView = Exclude<AppView, "livreur_details" | "client_details">;

const MAIN_VIEW_OPTIONS: { value: MainAppView; label: string; mobileLabel: string }[] = [
  { value: "livreurs", label: "Livreurs", mobileLabel: "Livreurs" },
  { value: "clients", label: "Clients", mobileLabel: "Clients" },
  { value: "finance", label: "Finance", mobileLabel: "Finance" },
  { value: "pomanai", label: "POMANAI", mobileLabel: "Pomanai" },
  { value: "zazatiana", label: "ZAZATIANA", mobileLabel: "Zazatiana" },
  { value: "salaires", label: "Salaires", mobileLabel: "Salaires" },
  { value: "aterinay", label: "ATERINAY", mobileLabel: "Aterinay" },
];

const getMainView = (currentView: AppView): MainAppView => {
  if (currentView === "livreur_details") return "livreurs";
  if (currentView === "client_details") return "clients";
  return currentView;
};

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
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false); 
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [view, setView] = useState<AppView>("livreurs");
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchText, setSearchText] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [voiceDraft, setVoiceDraft] = useState("");

  const askAssistant = async () => {
  if (!assistantQuestion) return;

  setAssistantLoading(true);
  setAssistantAnswer("");

  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: assistantQuestion,
        context: deliveries, // ⚠️ important
      }),
    });

    const data = await res.json();
    setAssistantAnswer(data.answer);
  } catch (err) {
    console.error(err);
    setAssistantAnswer("Erreur assistant");
  }

  setAssistantLoading(false);
};

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
  const handleScanDeliveryImage = useCallback(async (file: File) => {
  const { data } = await Tesseract.recognize(file, "eng");

  const text = data.text.toLowerCase();
  console.log("OCR TEXT:", text);

  const contact = text.match(/03\d{8}/)?.[0] || "";

  const extractNumber = (keyword: string) => {
    const regex = new RegExp(`${keyword}\\s*:?\\s*(\\d+)`, "i");
    const match = text.match(regex);
    return match ? match[1] : "";
  };

  let prix = extractNumber("prix");
  let frais = extractNumber("frais");

  if (!prix && !frais) {
    const numbers =
      text
        .match(/\d+/g)
        ?.filter((n) => !n.startsWith("03") && n.length < 8) || [];

    if (numbers.length === 1) {
      prix = numbers[0];
      frais = "0";
    }

    if (numbers.length >= 2) {
      prix = numbers[0];
      frais = numbers[1];
    }
  }

  const lieuMatch = text.match(/lieu\s*:?([^\n]+)/i);
  const lieu = lieuMatch ? lieuMatch[1].trim() : "";

  setForm((prev) => ({
    ...prev,
    contact: contact || prev.contact,
    lieu: lieu || prev.lieu,
    prix: prix || prev.prix,
    frais: frais || prev.frais,
  }));
}, []);

  const fillDeliveryFromVoice = useCallback((spokenText: string) => {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(virgule|point)\b/g, " virgule ")
        .replace(/[,.]/g, " virgule ")
        .replace(/[\u2019']/g, " ")
        .replace(/[-;:!?]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const compact = (value: string) => normalize(value).replace(/\s+/g, "");

    const distance = (a: string, b: string) => {
      const dp = Array.from({ length: a.length + 1 }, (_, i) =>
        Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
      );

      for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
          );
        }
      }

      return dp[a.length][b.length];
    };

    const keywordAliases: Record<string, string[]> = {
      client: [
        "client",
        "clients",
        "cliente",
        "clien",
        "clian",
        "cliant",
        "clyan",
        "clt",
        "cli",
        "klian",
        "kliyan",
        "klient",
        "nom",
      ],
      contact: ["contact", "telephone", "tel", "numero", "num", "phone"],
      lieu: ["lieu", "lieux", "lie", "leu", "liou", "adresse", "destination", "quartier", "endroit"],
      prix: ["prix", "pri", "prie", "montant", "tarif", "colis"],
      frais: ["frais", "frai", "fray", "fre", "fret", "livraison"],
      description: ["description", "descriptions", "desc", "article", "produit", "commande"],
      status: ["statut", "status", "etat"],
      raison: ["raison", "motif", "cause"],
      retour: ["retour", "retours", "r"],
    };

    const aliasToKeyword = Object.entries(keywordAliases).reduce<Record<string, string>>(
      (acc, [keyword, aliases]) => {
        aliases.forEach((alias) => {
          acc[alias] = keyword;
        });
        return acc;
      },
      {}
    );

    const correctKeyword = (word: string) => {
      if (aliasToKeyword[word]) return aliasToKeyword[word];
      if (word.length < 3) return word;

      let best = { keyword: word, score: Number.POSITIVE_INFINITY };

      Object.entries(aliasToKeyword).forEach(([alias, keyword]) => {
        const score = distance(word, alias);
        const allowed = alias.length <= 4 ? 1 : 2;
        if (score <= allowed && score < best.score) {
          best = { keyword, score };
        }
      });

      return best.keyword;
    };

    const text = normalize(spokenText)
      .split(/\s+/)
      .map(correctKeyword)
      .join(" ");

    const keywords = Object.keys(keywordAliases);
    const keywordPattern = keywords.join("|");

    const ignoredWords = new Set([
      "ajoute",
      "ajouter",
      "mets",
      "mettre",
      "livraison",
      "saisie",
      "pour",
      "chez",
      "avec",
      "le",
      "la",
      "les",
      "un",
      "une",
      "de",
      "du",
      "des",
      "a",
      "au",
      "sur",
    ]);

    const cleanValue = (value: string) =>
      value
        .split(/\s+/)
        .filter((word) => word && !ignoredWords.has(word) && !keywords.includes(word))
        .join(" ")
        .trim();

    const extractValue = (keyword: string) => {
      const regex = new RegExp(
        `(?:^|\\s)${keyword}\\s+(.+?)(?=\\s+(?:${keywordPattern})\\s+|$)`,
        "i"
      );
      return cleanValue(text.match(regex)?.[1]?.trim() || "");
    };

    const extractAfterStarter = (starters: string[]) => {
      const starterPattern = starters.join("|");
      const regex = new RegExp(
        `(?:^|\\s)(?:${starterPattern})\\s+(.+?)(?=\\s+(?:${keywordPattern})\\s+|$)`,
        "i"
      );
      return cleanValue(text.match(regex)?.[1]?.trim() || "");
    };

    type KnownVoiceValue = {
      value: string;
      compactValue: string;
      count: number;
      firstIndex: number;
    };

    const buildKnownValues = (
      values: string[],
      extras: readonly string[] = []
    ) => {
      const known = new Map<string, KnownVoiceValue>();

      [...values, ...extras].forEach((value, index) => {
        const cleaned = value.trim().toLowerCase();
        const key = compact(cleaned);
        if (!key) return;

        const existing = known.get(key);
        if (existing) {
          existing.count += 1;
          existing.firstIndex = Math.min(existing.firstIndex, index);
          return;
        }

        known.set(key, {
          value: cleaned,
          compactValue: key,
          count: extras.includes(value) ? 8 : 1,
          firstIndex: index,
        });
      });

      return [...known.values()].sort(
        (a, b) => b.count - a.count || a.firstIndex - b.firstIndex
      );
    };

    const knownPlaces = buildKnownValues(deliveries.map((delivery) => delivery.lieu));
    const knownClients = buildKnownValues(
      deliveries.map((delivery) => delivery.client),
      PARTNER_CLIENTS
    );

    const findKnownInText = (sourceText: string, knownValues: KnownVoiceValue[]) => {
      const sourceCompact = compact(sourceText);
      if (sourceCompact.length < 3) return null;

      return (
        knownValues.find((item) => {
          if (item.compactValue.length < 3) return false;
          return (
            sourceCompact.includes(item.compactValue) ||
            (sourceCompact.length >= 4 && item.compactValue.includes(sourceCompact))
          );
        }) ?? null
      );
    };

    const matchKnownValue = (
      value: string,
      knownValues: KnownVoiceValue[],
      allowRawValue: boolean
    ) => {
      const cleaned = cleanValue(value);
      if (!cleaned) return { value: "", corrected: false, source: "" };

      const exact = findKnownInText(cleaned, knownValues);
      if (exact) {
        return {
          value: exact.value,
          corrected: compact(cleaned) !== exact.compactValue,
          source: cleaned,
        };
      }

      const valueCompact = compact(cleaned);
      let best = {
        value: "",
        score: Number.POSITIVE_INFINITY,
        corrected: false,
      };

      knownValues.forEach((known) => {
        if (known.compactValue.length < 3 || valueCompact.length < 2) return;

        const score = distance(valueCompact, known.compactValue);
        const ratio = score / Math.max(valueCompact.length, known.compactValue.length);
        const isShort = valueCompact.length <= 3;
        const accepted = isShort ? score <= 1 : ratio <= 0.38;

        if (!accepted) return;

        const rankedScore = score - known.count * 0.05 + known.firstIndex * 0.001;
        if (rankedScore < best.score) {
          best = { value: known.value, score: rankedScore, corrected: true };
        }
      });

      if (best.value) {
        return { value: best.value, corrected: best.corrected, source: cleaned };
      }

      return { value: allowRawValue ? cleaned : "", corrected: false, source: cleaned };
    };

    const numberWords: Record<string, number> = {
      zero: 0,
      un: 1,
      une: 1,
      deux: 2,
      trois: 3,
      quatre: 4,
      cinq: 5,
      six: 6,
      sept: 7,
      huit: 8,
      neuf: 9,
      dix: 10,
      onze: 11,
      douze: 12,
      treize: 13,
      quatorze: 14,
      quinze: 15,
      seize: 16,
      vingt: 20,
      trente: 30,
      quarante: 40,
      cinquante: 50,
      soixante: 60,
    };

    const parseSpokenNumber = (value: string) => {
      const decimalMatch = value.match(/(\d+)\s+virgule\s+(\d+)/);
      if (decimalMatch) {
        return normalizeAriaryInput(`${decimalMatch[1]},${decimalMatch[2]}`);
      }

      const digits = value.match(/\d+/)?.[0] || "";
      if (digits) return normalizeAriaryInput(digits);

      const words = value.split(/\s+/);
      const decimalWordIndex = words.indexOf("virgule");
      if (decimalWordIndex > 0 && decimalWordIndex < words.length - 1) {
        const before = words.slice(0, decimalWordIndex).join(" ");
        const after = words.slice(decimalWordIndex + 1).join(" ");
        const beforeNumber = parseSpokenNumber(before).replace(/000$/, "");
        const afterNumber =
          numberWords[after] !== undefined ? String(numberWords[after]) : "";
        if (beforeNumber && afterNumber) {
          return normalizeAriaryInput(`${beforeNumber},${afterNumber}`);
        }
      }

      let total = 0;
      let current = 0;

      words.forEach((word) => {
        if (word in numberWords) {
          current += numberWords[word];
          return;
        }

        if (word === "cent") {
          current = Math.max(current, 1) * 100;
          return;
        }

        if (word === "mille") {
          total += Math.max(current, 1) * 1000;
          current = 0;
        }
      });

      const amount = total + current;
      return amount > 0 ? normalizeAriaryInput(String(amount)) : "";
    };

    const phoneMatch = text.match(/(?:\+?261|0)\s*3[2-8](?:\s*\d){7}/);
    const contactDigits = phoneMatch?.[0].replace(/\D/g, "") || "";
    const contact = contactDigits.startsWith("261")
      ? `0${contactDigits.slice(3)}`
      : contactDigits;

    const clientValue =
      extractValue("client") ||
      extractValue("nom") ||
      extractAfterStarter(["pour", "chez"]);
    const lieuValue = extractValue("lieu");
    const explicitClientMatch = matchKnownValue(
      clientValue,
      knownClients,
      Boolean(clientValue)
    );
    const clientMatch = explicitClientMatch.value
      ? explicitClientMatch
      : matchKnownValue(
          findKnownInText(text, knownClients)?.value || "",
          knownClients,
          false
        );
    const explicitLieuMatch = matchKnownValue(
      lieuValue,
      knownPlaces,
      Boolean(lieuValue)
    );
    const lieuMatch = explicitLieuMatch.value
      ? explicitLieuMatch
      : matchKnownValue(
          findKnownInText(text, knownPlaces)?.value || "",
          knownPlaces,
          false
        );
    const client = clientMatch.value;
    const lieu = lieuMatch.value;
    const prix = parseSpokenNumber(extractValue("prix"));
    const frais = parseSpokenNumber(extractValue("frais"));
    const description = cleanValue(extractValue("description"));
    const retour = parseSpokenNumber(extractValue("retour"));
    const raison = cleanValue(extractValue("raison"));

    const parseStatus = () => {
      if (/\b(non faite|pas faite|echec|annule|annulee|impossible)\b/.test(text)) {
        return "non_faite" as DeliveryStatus;
      }
      if (/\b(en cours|attente|attendant)\b/.test(text)) {
        return "en_cours" as DeliveryStatus;
      }
      if (/\b(faite|fait|termine|terminee|livree|valide)\b/.test(text)) {
        return "faite" as DeliveryStatus;
      }
      return "";
    };

    const status = parseStatus();

    const updates: Partial<typeof form> = {};
    const fields: string[] = [];
    const details: string[] = [];

    if (client) {
      updates.client = client;
      fields.push("client");
      details.push(
        clientMatch.corrected
          ? `client: ${client} (corrige depuis "${clientMatch.source}")`
          : `client: ${client}`
      );
    }
    if (contact) {
      updates.contact = contact;
      fields.push("contact");
      details.push(`contact: ${contact}`);
    }
    if (lieu) {
      updates.lieu = lieu;
      fields.push("lieu");
      details.push(
        lieuMatch.corrected
          ? `lieu: ${lieu} (corrige depuis "${lieuMatch.source}")`
          : `lieu: ${lieu}`
      );
    }
    if (prix) {
      updates.prix = prix;
      fields.push("prix");
      details.push(`prix: ${formatAr(Number(prix))}`);
    }
    if (frais) {
      updates.frais = frais;
      fields.push("frais");
      details.push(`frais: ${formatAr(Number(frais))}`);
    }
    if (description) {
      updates.description = description;
      fields.push("description");
      details.push(`description: ${description}`);
    }
    if (status) {
      updates.status = status;
      fields.push("statut");
      details.push(`statut: ${statusLabel(status)}`);
      if (status === "non_faite") {
        updates.retours = "1";
      }
      if (status === "en_cours") {
        updates.retours = "0";
        updates.raison = "";
      }
      if (status === "faite" && !retour) {
        updates.raison = "";
      }
    }
    if (raison) {
      updates.raison = raison;
      updates.status = "non_faite";
      updates.retours = "1";
      fields.push("raison");
      details.push(`raison: ${raison}`);
    }
    if (retour) {
      updates.retours = String(Number(retour));
      fields.push("retour");
      details.push(`retour: ${Number(retour)}`);
    }

    setForm((prev) => ({
      ...prev,
      ...updates,
      clientType:
        updates.client && isPartnerClient(updates.client)
          ? "entreprise"
          : prev.clientType,
    }));

    return { fields, details, text };
  }, [deliveries]);

  const applyVoiceDraft = useCallback(() => {
    if (!voiceDraft.trim()) {
      setVoiceMessage("Phrase vide.");
      return;
    }

    const result = fillDeliveryFromVoice(voiceDraft);
    setVoiceMessage(
      result.fields.length
        ? `Reconnu : ${result.details.join(" / ")}`
        : "Aucun champ livraison reconnu dans la phrase."
    );
  }, [fillDeliveryFromVoice, voiceDraft]);

  const startVoiceDelivery = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage("Dictee navigateur indisponible. Utilise le champ Phrase.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceListening(true);
      setVoiceMessage("Ecoute en cours...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      const result = fillDeliveryFromVoice(transcript);
      setVoiceMessage(
        result.fields.length
          ? `Entendu : ${transcript} / reconnu : ${result.details.join(" / ")}`
          : `Entendu : ${transcript} / aucun champ livraison reconnu.`
      );
    };

    recognition.onerror = (event) => {
      setVoiceListening(false);
      setVoiceMessage(
        event.error === "not-allowed"
          ? "Micro refuse par le navigateur."
          : "Dictee impossible. Reessaie en parlant plus clairement."
      );
    };

    recognition.onend = () => {
      setVoiceListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
      setVoiceListening(false);
      setVoiceMessage("La dictee n'a pas pu demarrer.");
    }
  }, [fillDeliveryFromVoice]);

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
            fullName: r.name,
            cin: "",
            role: "Livreur",
            periodStart: "",
            periodEnd: "",
            paymentDate: "",
            paymentMethod: "Especes",
            paymentReference: "",
            notes: "",
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
  const placeSuggestions = useMemo(() => {
    const seen = new Set<string>();

    return [...deliveries]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      .map((d) => d.lieu.trim())
      .filter((lieu) => {
        const key = lieu.toLowerCase();
        if (!lieu || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [deliveries]);

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
    const otherGainsForDate = otherGains.filter((g) => g.date === selectedDate);
    const otherExpensesForDate = otherExpenses.filter(
      (e) => e.date === selectedDate
    );

    const normalDone = faites.filter((d) => !isPartnerClient(d.client));
    const pomanaiDone = faites.filter((d) => d.client === "pomanai");
    const zazatianaDone = faites.filter((d) => d.client === "zazatiana");

    const clientColisNous = normalDone.reduce(
      (sum, d) => sum + (d.colisPayment === "nous" ? d.prix : 0),
      0
    );
    const clientColisMvola = normalDone.reduce(
      (sum, d) => sum + (d.colisPayment === "mobile_money_nous" ? d.prix : 0),
      0
    );
    const clientColisDirect = normalDone.reduce(
      (sum, d) => sum + (d.colisPayment === "direct_client" ? d.prix : 0),
      0
    );
    const clientFraisNous = normalDone.reduce(
      (sum, d) => sum + (d.fraisPayment === "nous" ? d.frais : 0),
      0
    );
    const clientFraisMvola = normalDone.reduce(
      (sum, d) => sum + (d.fraisPayment === "mobile_money_nous" ? d.frais : 0),
      0
    );
    const clientFraisDirect = normalDone.reduce(
      (sum, d) => sum + (d.fraisPayment === "direct_client" ? d.frais : 0),
      0
    );

    const autoPrixColis = clientColisNous + clientColisMvola;
    const autoFraisLivraison =
      clientFraisNous + clientFraisMvola + clientFraisDirect;

    const pomanaiPrixColis = pomanaiDone.reduce((sum, d) => sum + d.prix, 0);
    const zazatianaPrixColis = zazatianaDone.reduce((sum, d) => sum + d.prix, 0);
    const isPartnerFraisReceived = (d: Delivery) =>
      d.paymentStatus === "recu" && d.fraisPayment !== "direct_client";
    const pomanaiFraisLivraisonRecu = pomanaiDone
      .filter(isPartnerFraisReceived)
      .reduce((sum, d) => sum + d.frais, 0);
    const zazatianaFraisLivraisonRecu = zazatianaDone
      .filter(isPartnerFraisReceived)
      .reduce((sum, d) => sum + d.frais, 0);
    const partnerFraisLivraisonRecu =
      pomanaiFraisLivraisonRecu + zazatianaFraisLivraisonRecu;
    const partnerPrixColis = pomanaiPrixColis + zazatianaPrixColis;

    const clientColisAReverser = clientColisNous + clientColisMvola;
    const recoveryAmount = payrollStats.reduce(
      (sum, p) => sum + p.recoveryAmount,
      0
    );
    const clientReceiptAdjustmentsTotal = clientAdjustments
      .filter((adjustment) => adjustment.date === selectedDate)
      .reduce((sum, adjustment) => sum + adjustment.amount, 0);
    const clientAdjustmentsTotal = -clientReceiptAdjustmentsTotal;

    const manualGains = otherGainsForDate.reduce((sum, g) => sum + g.amount, 0);
    const manualExpenses = otherExpensesForDate.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const totalGains =
      clientColisNous +
      clientColisMvola +
      autoFraisLivraison +
      recoveryAmount +
      partnerPrixColis +
      partnerFraisLivraisonRecu +
      Math.max(clientAdjustmentsTotal, 0) +
      manualGains;

    const totalExpenses =
      clientColisAReverser +
      Math.max(-clientAdjustmentsTotal, 0) +
      manualExpenses;
    const balance = totalGains - totalExpenses;

    return {
      clientColisNous,
      clientColisMvola,
      clientColisDirect,
      clientFraisNous,
      clientFraisMvola,
      clientFraisDirect,
      autoPrixColis,
      autoFraisLivraison,
      pomanaiPrixColis,
      zazatianaPrixColis,
      partnerPrixColis,
      pomanaiFraisLivraisonRecu,
      zazatianaFraisLivraisonRecu,
      partnerFraisLivraisonRecu,
      totalRecusClientsFinance: clientColisAReverser,
      recoveryAmount,
      clientAdjustmentsTotal,
      manualGains,
      manualExpenses,
      totalGains,
      totalExpenses,
      balance,
    };
  }, [
    clientAdjustments,
    deliveriesForDate,
    otherGains,
    otherExpenses,
    payrollStats,
    selectedDate,
  ]);

  const buildPartnerStats = useCallback(
    (partnerName: string, purchases: PartnerPurchaseEntry[]) => {
      const dailyRows = deliveriesForDate.filter(
        (d) => d.client === partnerName
      );
      const monthlyRows = deliveriesForMonth.filter(
        (d) => d.client === partnerName
      );
      const dailyDoneRows = dailyRows.filter((d) => d.status === "faite");
      const monthlyDoneRows = monthlyRows.filter((d) => d.status === "faite");

      const dailyColis = dailyDoneRows.reduce((sum, d) => sum + d.prix, 0);
      const monthlyColis = monthlyDoneRows.reduce((sum, d) => sum + d.prix, 0);

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
    const otherGainsForDate = otherGains.filter((g) => g.date === selectedDate);
    const otherExpensesForDate = otherExpenses.filter(
      (e) => e.date === selectedDate
    );
    const totalFrais = faites.reduce((sum, d) => sum + d.frais, 0);
    const totalDeliveries = faites.length;
    const logistics = totalDeliveries * 500;
    const manualGains = otherGainsForDate.reduce((sum, g) => sum + g.amount, 0);
    const manualExpenses = otherExpensesForDate.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const result = totalFrais + manualGains - totalSalaries - logistics - manualExpenses;

    return {
      totalFrais,
      totalDeliveries,
      manualGains,
      manualExpenses,
      logistics,
      totalSalaries,
      result,
    };
  }, [deliveriesForDate, otherGains, otherExpenses, selectedDate, totalSalaries]);

  const unlockApp = useCallback(() => {
    if (pinInput === APP_PIN) {
      setIsUnlocked(true);
      setPinError("");
      return;
    }
    setPinError("Code incorrect");
  }, [pinInput]);

  const addDelivery = useCallback(async() => {
    const normalizedPrix = normalizeAriaryInput(form.prix);
    const normalizedFrais = normalizeAriaryInput(form.frais);

    if (!form.client.trim() || !form.lieu.trim() || !normalizedPrix || !normalizedFrais) {
      return false;
    }
    if (form.contact.trim() && !form.contact.trim().startsWith("03")) {
  return false;
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
      prix: Number(normalizedPrix),
      frais: Number(normalizedFrais),
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
  return false;
}

setDeliveries((prev) => [data as Delivery, ...prev]);



    setForm((prev) => ({
      ...prev,
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
    return true;
  }, [form]);

  const updateDeliveryField = useCallback(
  async (id: number, field: keyof Delivery, value: string | number) => {
    const current = deliveries.find((d) => d.id === id);
    if (!current) return;

    const updated = { ...current, [field]: value } as Delivery;

    if (field === "client") {
      updated.client = String(value).trim().toLowerCase();
      updated.clientType = isPartnerClient(updated.client)
        ? "entreprise"
        : "normal";
    }

    if (field === "clientType") {
      updated.clientType = value as ClientType;
    }

    if (field === "status") {
      if (value !== "non_faite") updated.raison = "";
      if (value === "non_faite") updated.retours = 1;
      if (value === "en_cours") updated.retours = 0;
    }

    const { id: _id, ...deliveryToUpdate } = updated;

    const { data, error } = await supabase
      .from("deliveries")
      .update(deliveryToUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.log("SUPABASE UPDATE ERROR:", error);
      alert("Erreur Supabase : la modification n'a pas ete enregistree.");
      return;
    }

    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? (data as Delivery) : d))
    );
  },
  [deliveries]
);
          

  const togglePaymentReceived = useCallback(async (id: number) => {
    const current = deliveries.find((d) => d.id === id);
    if (!current) return;

    const nextPaymentStatus =
      current.paymentStatus === "recu" ? "non_recu" : "recu";

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              paymentStatus: nextPaymentStatus,
            }
          : d
      )
    );

    const { error } = await supabase
      .from("deliveries")
      .update({ paymentStatus: nextPaymentStatus })
      .eq("id", id);

    if (error) {
      console.log("SUPABASE PAYMENT UPDATE ERROR:", error);
      alert("Erreur Supabase : le statut de paiement n'a pas ete enregistre.");
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? current : d))
      );
    }
  }, [deliveries]);

  const markAllRiderPaymentsReceived = useCallback(async (riderName: string) => {
    const idsToMark = deliveries
      .filter((d) => d.date === selectedDate)
      .filter((d) => d.rider === riderName)
      .filter((d) => getRiderVersement(d) > 0)
      .map((d) => d.id);

    if (idsToMark.length === 0) return;

    const previousDeliveries = deliveries;

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.date !== selectedDate) return d;
        if (d.rider !== riderName) return d;
        if (getRiderVersement(d) <= 0) return d;
        return { ...d, paymentStatus: "recu" };
      })
    );

    const { error } = await supabase
      .from("deliveries")
      .update({ paymentStatus: "recu" })
      .in("id", idsToMark);

    if (error) {
      console.log("SUPABASE MARK ALL PAYMENT ERROR:", error);
      alert("Erreur Supabase : les versements recus n'ont pas ete enregistres.");
      setDeliveries(previousDeliveries);
    }
  }, [deliveries, selectedDate]);

  const deleteDelivery = useCallback(async (id: number) => {
  const { error } = await supabase
    .from("deliveries")
    .delete()
    .eq("id", id);

  if (error) {
    console.log("SUPABASE DELETE ERROR:", error);
    alert("Erreur Supabase : la livraison n'a pas ete supprimee.");
    return;
  }

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
    const normalizedAmount = normalizeAriaryInput(gainForm.amount);
    if (!gainForm.label.trim() || !normalizedAmount) return;
    setOtherGains((prev) => [
      {
        id: Date.now(),
        date: selectedDate,
        label: gainForm.label.trim(),
        amount: Number(normalizedAmount),
      },
      ...prev,
    ]);
    setGainForm({ label: "", amount: "" });
  }, [gainForm, selectedDate]);

  const addOtherExpense = useCallback(() => {
    const normalizedAmount = normalizeAriaryInput(expenseForm.amount);
    if (!expenseForm.label.trim() || !normalizedAmount) return;
    setOtherExpenses((prev) => [
      {
        id: Date.now(),
        date: selectedDate,
        label: expenseForm.label.trim(),
        amount: Number(normalizedAmount),
      },
      ...prev,
    ]);
    setExpenseForm({ label: "", amount: "" });
  }, [expenseForm, selectedDate]);

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
      const normalizedAmount = normalizeAriaryInput(amount);
      if (!normalizedAmount) return;

      const entry: PartnerPurchaseEntry = {
        id: Date.now(),
        date,
        amount: Number(normalizedAmount),
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

  const updatePayrollInfo = useCallback(
    (
      riderName: string,
      field:
        | "fullName"
        | "cin"
        | "role"
        | "periodStart"
        | "periodEnd"
        | "paymentDate"
        | "paymentMethod"
        | "paymentReference"
        | "notes",
      value: string
    ) => {
      setRiderPayroll((prev) =>
        prev.map((p) => (p.rider === riderName ? { ...p, [field]: value } : p))
      );
    },
    []
  );

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
    const normalizedAmount = normalizeAriaryInput(formData.amount);
    if (!normalizedAmount) return;

    const advance: SalaryAdvance = {
      id: Date.now(),
      date: today,
      label: formData.label.trim(),
      amount: Number(normalizedAmount),
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

  const currentMainView = getMainView(view);
  const switchMainView = useCallback((nextView: MainAppView) => {
    setView(nextView);
    setOpenDeliveryId(null);
    setOpenPartner(null);
    setOpenSalaryRider(null);
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
    <div className={`app appView-${currentMainView}`}>
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
              value={currentMainView}
              onChange={(e) => switchMainView(e.target.value as MainAppView)}
              className="pageSelect"
            >
              {MAIN_VIEW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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

      <details className="assistantPanel">
        <summary>Assistant IA</summary>
        <div className="assistantContent">
          <input
            type="search"
            placeholder="Question sur les livraisons, clients, salaires..."
            value={assistantQuestion}
            onChange={(e) => setAssistantQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askAssistant();
            }}
          />

          <button
            className="primaryBtn"
            type="button"
            onClick={askAssistant}
            disabled={assistantLoading}
          >
            {assistantLoading ? "Analyse..." : "Demander"}
          </button>

          {assistantAnswer && (
            <div className="assistantAnswer">{assistantAnswer}</div>
          )}
        </div>
      </details>

      {view === "livreurs" && (
        <LivreursView
          riders={riders}
          activeRiders={activeRiders}
          riderStats={riderStats}
          globalStats={globalStats}
          deliveries={searchedDeliveries}
          placeSuggestions={placeSuggestions}
          form={form}
          newRiderName={newRiderName}
          openAddDelivery={openAddDelivery}
          openRiderList={openRiderList}
          openGlobalDetails={openGlobalDetails}
          openRiderManagement={openRiderManagement}
          voiceListening={voiceListening}
          voiceMessage={voiceMessage}
          voiceDraft={voiceDraft}
          onFormChange={setForm}
          onAddDelivery={addDelivery}
          onAddRider={addRider}
          onUpdateRiderName={updateRiderName}
          onToggleRiderActive={setConfirmRiderId}
          onMarkAllReceived={markAllRiderPaymentsReceived}
          onScanDeliveryImage={handleScanDeliveryImage}
          onStartVoiceDelivery={startVoiceDelivery}
          onVoiceDraftChange={setVoiceDraft}
          onApplyVoiceDraft={applyVoiceDraft}
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
          riders={activeRiders}
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
          riders={activeRiders}
          clientAdjustments={clientAdjustments.filter(
  (a) => a.client === selectedClientDetails
)}
          selectedDate={selectedDate}
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
          selectedDate={selectedDate}
          otherGains={otherGains.filter((g) => g.date === selectedDate)}
          otherExpenses={otherExpenses.filter((e) => e.date === selectedDate)}
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
          onDeletePurchase={(id) => deletePartnerPurchase("pomanai", id)}
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
          onDeletePurchase={(id) => deletePartnerPurchase("zazatiana", id)}
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
          onPayrollInfoChange={updatePayrollInfo}
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

      <nav className="mobileBottomNav" aria-label="Navigation principale">
        {MAIN_VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={currentMainView === option.value ? "activeMobileNav" : ""}
            onClick={() => switchMainView(option.value)}
          >
            {option.mobileLabel}
          </button>
        ))}
      </nav>
    </div>
  );
}

