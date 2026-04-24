import { Rider, RiderPayroll } from "./types";

export const APP_PIN = "hantatianatojo";

export const STORAGE_KEYS = {
  DELIVERIES: "aterinay_deliveries_v23",
  RIDERS: "aterinay_riders_v23",
  OTHER_GAINS: "aterinay_other_gains_v23",
  OTHER_EXPENSES: "aterinay_other_expenses_v23",
  POMANAI_PURCHASES: "aterinay_pomanai_purchases_v23",
  ZAZATIANA_PURCHASES: "aterinay_zazatiana_purchases_v23",
  CLIENT_ADJUSTMENTS: "aterinay_client_adjustments",
  RIDER_PAYROLL: "aterinay_rider_payroll_v23",
} as const;

export const PARTNER_CLIENTS = ["pomanai", "zazatiana"] as const;

export const INITIAL_RIDERS: Rider[] = [
  { id: 1, name: "mamy", active: true },
  { id: 2, name: "mario", active: true },
  { id: 3, name: "tahiana", active: true },
  { id: 4, name: "eric", active: true },
  { id: 5, name: "fetra", active: true },
];

export const initialPayroll = (riders: Rider[]): RiderPayroll[] =>
  riders.map((r) => ({
    rider: r.name,
    baseSalary: 0,
    recoveries: 0,
    advances: [],
  }));
