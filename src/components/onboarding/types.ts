export type TourId =
  | "welcome"
  | "nav"
  | "pos"
  | "products"
  | "expenses"
  | "dashboard"
  | "transactions"
  | "reports"
  | "finance"
  | "cashflow";

export type OnboardingState = Record<TourId, boolean> & {
  tipsEnabled: boolean;
};

export const DEFAULT_STATE: OnboardingState = {
  welcome: false,
  nav: false,
  pos: false,
  products: false,
  expenses: false,
  dashboard: false,
  transactions: false,
  reports: false,
  finance: false,
  cashflow: false,
  tipsEnabled: true,
};

export type TourStep = {
  id: string;
  target: string; // CSS selector for spotlight, e.g. [data-onboarding="pos-search"]
  title: string;
  description: string;
  icon?: string;
  placement?: "top" | "bottom" | "auto";
  // optional: hide spotlight (center modal)
  center?: boolean;
};

export type TourDef = {
  id: TourId;
  title?: string;
  steps: TourStep[];
};
