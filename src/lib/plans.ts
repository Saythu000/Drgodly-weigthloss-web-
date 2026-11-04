export interface Plan {
  id: string;
  drugType: "semaglutide" | "liraglutide" | "tirzepatide";
  tier: "affordable" | "standard" | "premium";
  prices: Record<string, number>; // Country code -> total plan price
  durationMonths: number;
}

export const AVAILABLE_PLANS: Plan[] = [
  // Semaglutide
  { 
    id: "sema-1", 
    drugType: "semaglutide", 
    tier: "affordable", 
    prices: { US: 299, GB: 229, DE: 279, FR: 279, IN: 24900 }, 
    durationMonths: 1
  },
  { 
    id: "sema-3", 
    drugType: "semaglutide", 
    tier: "affordable", 
    prices: { US: 747, GB: 573, DE: 699, FR: 699, IN: 61900 }, 
    durationMonths: 3
  },
  { 
    id: "sema-6", 
    drugType: "semaglutide", 
    tier: "affordable", 
    prices: { US: 1314, GB: 1008, DE: 1230, FR: 1230, IN: 109000 }, 
    durationMonths: 6
  },
  { 
    id: "sema-12", 
    drugType: "semaglutide", 
    tier: "affordable", 
    prices: { US: 2148, GB: 1644, DE: 2010, FR: 2010, IN: 178000 }, 
    durationMonths: 12
  },
  
  // Tirzepatide
  { 
    id: "tirz-1", 
    drugType: "tirzepatide", 
    tier: "premium", 
    prices: { US: 399, GB: 309, DE: 379, FR: 379, IN: 33100 }, 
    durationMonths: 1
  },
  { 
    id: "tirz-3", 
    drugType: "tirzepatide", 
    tier: "premium", 
    prices: { US: 897, GB: 690, DE: 840, FR: 840, IN: 74500 }, 
    durationMonths: 3
  },
];
