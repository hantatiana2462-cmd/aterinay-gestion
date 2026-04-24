export type DeliveryStatus = "faite" | "en_cours" | "non_faite";
export type AppView =
  | "livreurs"
  | "livreur_details"
  | "clients"
  | "client_details"
  | "finance"
  | "pomanai"
  | "zazatiana"
  | "salaires"
  | "aterinay";

export type PaymentMode = "nous" | "mobile_money_nous" | "direct_client";
export type ClientType = "normal" | "entreprise";
export type PaymentStatus = "non_recu" | "recu";

export type Delivery = {
  id: number;
  date: string;
  rider: string;
  client: string;
  contact?: string;
  clientType: ClientType;
  lieu: string;
  description: string;
  prix: number;
  frais: number;
  status: DeliveryStatus;
  raison: string;
  retours: number;
  colisPayment: PaymentMode;
  fraisPayment: PaymentMode;
  paymentStatus: PaymentStatus;
};

export type Rider = {
  id: number;
  name: string;
  active: boolean;
};

export type MoneyEntry = {
  id: number;
  label: string;
  amount: number;
};

export type PartnerPurchaseEntry = {
  id: number;
  date: string;
  amount: number;
  description: string;
};

export type SalaryAdvance = {
  id: number;
  label: string;
  amount: number;
};

export type RiderPayroll = {
  rider: string;
  baseSalary: number;
  recoveries: number;
  advances: SalaryAdvance[];
};

export type ClientAdjustment = {
  id: number;
  client: string;
  date: string;
  label: string;
  type: "deduction" | "report" | "correction";
  amount: number;
};
